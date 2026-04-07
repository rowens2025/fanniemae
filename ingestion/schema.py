"""DDL for raw_freddie layer (generated from column lists in freddie_columns)."""

from __future__ import annotations

from .freddie_columns import MONTHLY_PERFORMANCE_COLUMNS, ORIGINATION_COLUMNS


def raw_freddie_ddl() -> str:
    def cols_text(names: tuple[str, ...]) -> str:
        return ",\n    ".join(f'{n} TEXT' for n in names)

    orig_body = cols_text(ORIGINATION_COLUMNS)
    perf_body = cols_text(MONTHLY_PERFORMANCE_COLUMNS)

    return f"""
CREATE SCHEMA IF NOT EXISTS raw_freddie;

CREATE TABLE IF NOT EXISTS raw_freddie.origination_raw (
    {orig_body},
    source_year SMALLINT NOT NULL,
    source_quarter SMALLINT NOT NULL,
    source_file_name TEXT NOT NULL,
    source_folder TEXT NOT NULL,
    ingested_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS raw_freddie.monthly_performance_raw (
    {perf_body},
    source_year SMALLINT NOT NULL,
    source_quarter SMALLINT NOT NULL,
    source_file_name TEXT NOT NULL,
    source_folder TEXT NOT NULL,
    ingested_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
"""
