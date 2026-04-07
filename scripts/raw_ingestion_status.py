"""Print row counts in raw_freddie by source_year (uses repo root .env DATABASE_URL)."""

from __future__ import annotations

import os
import sys
from pathlib import Path
from urllib.parse import urlparse

from dotenv import load_dotenv
import psycopg


def main() -> int:
    repo = Path(__file__).resolve().parents[1]
    load_dotenv(repo / ".env")
    dsn = os.environ.get("DATABASE_URL")
    if not dsn:
        print("DATABASE_URL not set", file=sys.stderr)
        return 1
    parsed = urlparse(dsn)
    host = parsed.hostname or "?"
    db = (parsed.path or "").lstrip("/") or "?"
    print(f"Connecting to host={host} db={db}\n")

    with psycopg.connect(dsn, connect_timeout=30) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT source_year, COUNT(*)::bigint AS n
                FROM raw_freddie.origination_raw
                GROUP BY source_year
                ORDER BY source_year
                """
            )
            print("raw_freddie.origination_raw:")
            for y, n in cur.fetchall():
                print(f"  {y}: {n:,}")
            cur.execute(
                """
                SELECT source_year, COUNT(*)::bigint AS n
                FROM raw_freddie.monthly_performance_raw
                GROUP BY source_year
                ORDER BY source_year
                """
            )
            print("raw_freddie.monthly_performance_raw:")
            for y, n in cur.fetchall():
                print(f"  {y}: {n:,}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
