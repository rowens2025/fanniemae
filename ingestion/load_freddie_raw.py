"""
Load pipe-delimited Freddie Mac historical origination and monthly performance
files into raw_freddie.* tables using chunked COPY.
"""

from __future__ import annotations

import argparse
import logging
import os
import re
import sys
from collections.abc import Iterator
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv
import psycopg

from .freddie_columns import MONTHLY_PERFORMANCE_COLUMNS, ORIGINATION_COLUMNS
from .schema import raw_freddie_ddl

logger = logging.getLogger(__name__)

EXPECTED_FIELDS = 32
CHUNK_SIZE = 50_000

QUARTER_DIR_RE = re.compile(r"historical_data_(?P<year>\d{4})Q(?P<q>[1-4])$", re.IGNORECASE)


@dataclass(frozen=True)
class QuarterFiles:
    year: int
    quarter: int
    folder: Path
    origination_path: Path
    performance_path: Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--raw-root",
        type=Path,
        default=Path("data/raw"),
        help="Root folder containing historical_data_* trees",
    )
    parser.add_argument(
        "--quarter",
        type=str,
        default=None,
        help='Only load this quarter, e.g. "2022Q1". Default: first match found when scanning.',
    )
    parser.add_argument(
        "--all-quarters",
        action="store_true",
        help="Load every discovered quarter under --raw-root (sorted by year, quarter)",
    )
    parser.add_argument(
        "--init-schema",
        action="store_true",
        help="Create raw_freddie schema and tables before loading",
    )
    parser.add_argument(
        "--truncate",
        action="store_true",
        help="Truncate raw_freddie.origination_raw and monthly_performance_raw before load",
    )
    parser.add_argument(
        "--delete-years",
        type=str,
        default=None,
        help='Remove existing rows where source_year matches, e.g. "2021" or "2021,2022" (both raw tables). Use before reloading a year.',
    )
    parser.add_argument(
        "--years",
        type=str,
        default=None,
        help='When used with --all-quarters, only load these calendar years, e.g. "2021" or "2022,2023".',
    )
    parser.add_argument(
        "--chunk-size",
        type=int,
        default=CHUNK_SIZE,
        help=f"Rows per COPY batch (default {CHUNK_SIZE})",
    )
    parser.add_argument(
        "--max-rows",
        type=int,
        default=None,
        help="Optional cap applied to each file unless overridden below",
    )
    parser.add_argument(
        "--max-rows-origination",
        type=int,
        default=None,
        help="Row cap for origination file only",
    )
    parser.add_argument(
        "--max-rows-performance",
        type=int,
        default=None,
        help="Row cap for monthly performance file only",
    )
    return parser.parse_args()


def discover_quarters(raw_root: Path) -> list[QuarterFiles]:
    if not raw_root.is_dir():
        raise FileNotFoundError(f"raw root not found: {raw_root.resolve()}")

    quarters: list[QuarterFiles] = []
    for year_dir in sorted(raw_root.glob("historical_data_*")):
        if not year_dir.is_dir():
            continue
        for qdir in sorted(year_dir.glob("historical_data_*Q*")):
            if not qdir.is_dir():
                continue
            m = QUARTER_DIR_RE.match(qdir.name)
            if not m:
                continue
            year = int(m.group("year"))
            q = int(m.group("q"))
            orig = qdir / f"historical_data_{year}Q{q}.txt"
            perf = qdir / f"historical_data_time_{year}Q{q}.txt"
            if not orig.is_file():
                logger.warning("Missing origination file for %sQ%s: %s", year, q, orig)
                continue
            if not perf.is_file():
                logger.warning("Missing performance file for %sQ%s: %s", year, q, perf)
                continue
            quarters.append(
                QuarterFiles(
                    year=year,
                    quarter=q,
                    folder=qdir,
                    origination_path=orig,
                    performance_path=perf,
                )
            )
    quarters.sort(key=lambda x: (x.year, x.quarter))
    return quarters


def parse_quarter_filter(spec: str) -> tuple[int, int]:
    m = re.match(r"^(?P<y>\d{4})Q(?P<q>[1-4])$", spec.strip(), re.IGNORECASE)
    if not m:
        raise ValueError(f'Invalid --quarter "{spec}"; expected like 2022Q1')
    return int(m.group("y")), int(m.group("q"))


def init_schema(conn: psycopg.Connection) -> None:
    with conn.cursor() as cur:
        cur.execute(raw_freddie_ddl())
    conn.commit()
    logger.info("Applied raw_freddie DDL")


def truncate_raw_tables(conn: psycopg.Connection) -> None:
    with conn.cursor() as cur:
        cur.execute("TRUNCATE TABLE raw_freddie.origination_raw")
        cur.execute("TRUNCATE TABLE raw_freddie.monthly_performance_raw")
    conn.commit()
    logger.info("Truncated raw_freddie.origination_raw and monthly_performance_raw")


def parse_year_list(spec: str | None) -> list[int]:
    if not spec or not str(spec).strip():
        return []
    out: list[int] = []
    for part in str(spec).replace(" ", "").split(","):
        if not part:
            continue
        y = int(part)
        if y < 1990 or y > 2100:
            raise ValueError(f"Year out of range: {y}")
        out.append(y)
    return sorted(set(out))


def delete_by_years(conn: psycopg.Connection, years: list[int]) -> None:
    if not years:
        return
    ph = ",".join(["%s"] * len(years))
    with conn.cursor() as cur:
        cur.execute(
            f"DELETE FROM raw_freddie.origination_raw WHERE source_year IN ({ph})",
            years,
        )
        o = cur.rowcount
        cur.execute(
            f"DELETE FROM raw_freddie.monthly_performance_raw WHERE source_year IN ({ph})",
            years,
        )
        p = cur.rowcount
    conn.commit()
    logger.info(
        "Deleted rows for source_year in %s: origination_raw=%s, monthly_performance_raw=%s",
        years,
        o,
        p,
    )


def iter_file_rows(path: Path, encoding: str = "utf-8") -> Iterator[list[str]]:
    with path.open("r", encoding=encoding, newline="") as f:
        for line in f:
            if not line:
                continue
            yield line.rstrip("\r\n").split("|")


def source_folder_label(raw_root: Path, quarter_folder: Path) -> str:
    try:
        return str(quarter_folder.resolve().relative_to(raw_root.resolve()))
    except ValueError:
        return str(quarter_folder)


def copy_chunk(
    conn: psycopg.Connection,
    table: str,
    column_names: tuple[str, ...],
    rows: list[tuple[object, ...]],
) -> None:
    if not rows:
        return
    col_list = ", ".join(column_names)
    cols_meta = col_list + ", source_year, source_quarter, source_file_name, source_folder"
    sql = f"COPY raw_freddie.{table} ({cols_meta}) FROM STDIN"
    with conn.cursor() as cur:
        with cur.copy(sql) as copy:
            for row in rows:
                copy.write_row(row)


def load_file(
    conn: psycopg.Connection,
    *,
    path: Path,
    table: str,
    freddie_cols: tuple[str, ...],
    source_year: int,
    source_quarter: int,
    raw_root: Path,
    quarter_folder: Path,
    chunk_size: int,
    max_rows: int | None = None,
) -> tuple[int, int]:
    bad_lines = 0
    batch: list[tuple[object, ...]] = []
    total = 0
    accepted = 0
    folder_label = source_folder_label(raw_root, quarter_folder)
    fname = path.name
    log_every = max(chunk_size * 40, 1_000_000)  # ~1M+ rows between progress lines
    last_logged = 0

    logger.info("Reading %s into raw_freddie.%s (progress every ~%s rows)…", path.name, table, log_every)

    for parts in iter_file_rows(path):
        if len(parts) != EXPECTED_FIELDS:
            bad_lines += 1
            if bad_lines <= 5:
                logger.error(
                    "Bad field count %s (expected %s) in %s — sample: %s",
                    len(parts),
                    EXPECTED_FIELDS,
                    path,
                    parts[:10],
                )
            continue
        if max_rows is not None and accepted >= max_rows:
            break
        batch.append(
            (
                *parts,
                source_year,
                source_quarter,
                fname,
                folder_label,
            )
        )
        accepted += 1
        if len(batch) >= chunk_size:
            copy_chunk(conn, table, freddie_cols, batch)
            conn.commit()
            total += len(batch)
            batch.clear()
            if total - last_logged >= log_every:
                logger.info("  … %s rows committed so far (%s)", f"{total:,}", path.name)
                last_logged = total

    if batch:
        copy_chunk(conn, table, freddie_cols, batch)
        conn.commit()
        total += len(batch)
        if total - last_logged >= log_every:
            logger.info("  … %s rows committed so far (%s)", f"{total:,}", path.name)
            last_logged = total

    if bad_lines:
        logger.warning("%s: skipped %s malformed lines", path.name, bad_lines)
    logger.info("Loaded %s rows from %s", total, path)
    return total, bad_lines


def select_quarter(quarters: list[QuarterFiles], quarter_arg: str | None) -> QuarterFiles:
    if not quarters:
        raise RuntimeError("No quarter folders with both data files found under raw root")
    if quarter_arg is None:
        q = quarters[0]
        logger.info(
            "No --quarter given; loading first found quarter %sQ%s (%s)",
            q.year,
            q.quarter,
            q.folder,
        )
        return q
    y, qq = parse_quarter_filter(quarter_arg)
    for q in quarters:
        if q.year == y and q.quarter == qq:
            return q
    raise RuntimeError(f"Quarter {y}Q{qq} not found under configured raw root")


def main() -> int:
    logging.basicConfig(
        level=logging.INFO,
        format="%(levelname)s %(message)s",
    )
    args = parse_args()
    repo_root = Path(__file__).resolve().parents[1]
    load_dotenv(repo_root / ".env")

    dsn = os.environ.get("DATABASE_URL")
    if not dsn:
        logger.error("DATABASE_URL is not set")
        return 1

    raw_root = args.raw_root
    if not raw_root.is_absolute():
        raw_root = (repo_root / raw_root).resolve()

    quarters = discover_quarters(raw_root)
    if args.all_quarters:
        targets = quarters
        if not targets:
            logger.error("No complete quarter folders found under %s", raw_root)
            return 1
        year_filter = parse_year_list(args.years)
        if year_filter:
            targets = [q for q in targets if q.year in year_filter]
            if not targets:
                logger.error("No quarters match --years %s under %s", year_filter, raw_root)
                return 1
            logger.info("Loading %s quarters (--all-quarters, filtered to years %s)", len(targets), year_filter)
        else:
            logger.info("Loading %s quarters (--all-quarters)", len(targets))
    else:
        targets = [select_quarter(quarters, args.quarter)]
        year_filter = parse_year_list(args.years)
        if year_filter and targets[0].year not in year_filter:
            logger.error(
                "Quarter %sQ%s is not in --years %s",
                targets[0].year,
                targets[0].quarter,
                year_filter,
            )
            return 1

    max_o = args.max_rows_origination
    max_p = args.max_rows_performance
    if args.max_rows is not None:
        max_o = args.max_rows if max_o is None else max_o
        max_p = args.max_rows if max_p is None else max_p

    sum_o = sum_p = sum_o_bad = sum_p_bad = 0

    delete_years = parse_year_list(args.delete_years)
    if delete_years and not args.all_quarters and not args.quarter:
        logger.error(
            "--delete-years requires --all-quarters (typically with --years) or an explicit --quarter "
            "so the loader does not default to the first discovered quarter after deleting."
        )
        return 1

    with psycopg.connect(dsn) as conn:
        if args.init_schema:
            init_schema(conn)
        if args.truncate:
            truncate_raw_tables(conn)
        if delete_years:
            logger.info("Deleting existing rows for source_year in %s (this can take a few minutes on large tables)…", delete_years)
            delete_by_years(conn, delete_years)

        for target in targets:
            logger.info(
                "Loading quarter %sQ%s from %s",
                target.year,
                target.quarter,
                target.folder,
            )
            o_tot, o_bad = load_file(
                conn,
                path=target.origination_path,
                table="origination_raw",
                freddie_cols=ORIGINATION_COLUMNS,
                source_year=target.year,
                source_quarter=target.quarter,
                raw_root=raw_root,
                quarter_folder=target.folder,
                chunk_size=args.chunk_size,
                max_rows=max_o,
            )
            p_tot, p_bad = load_file(
                conn,
                path=target.performance_path,
                table="monthly_performance_raw",
                freddie_cols=MONTHLY_PERFORMANCE_COLUMNS,
                source_year=target.year,
                source_quarter=target.quarter,
                raw_root=raw_root,
                quarter_folder=target.folder,
                chunk_size=args.chunk_size,
                max_rows=max_p,
            )
            sum_o += o_tot
            sum_p += p_tot
            sum_o_bad += o_bad
            sum_p_bad += p_bad

    logger.info("Done. Total origination rows=%s (bad lines=%s)", sum_o, sum_o_bad)
    logger.info("Done. Total performance rows=%s (bad lines=%s)", sum_p, sum_p_bad)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
