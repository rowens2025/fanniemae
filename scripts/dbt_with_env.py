"""Run dbt with PG* env vars from repo-root .env DATABASE_URL (Neon/psycopg URLs supported)."""
from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path
from urllib.parse import urlparse, unquote


def main() -> None:
    root = Path(__file__).resolve().parent.parent
    try:
        from dotenv import load_dotenv
    except ImportError:
        print("Install python-dotenv: pip install python-dotenv", file=sys.stderr)
        sys.exit(1)

    load_dotenv(root / ".env")
    raw = os.environ.get("DATABASE_URL")
    if not raw:
        print("DATABASE_URL missing in .env at repo root.", file=sys.stderr)
        sys.exit(1)

    url = raw.replace("postgresql+psycopg://", "postgresql://", 1)
    u = urlparse(url)
    env = os.environ.copy()
    env["PGHOST"] = u.hostname or ""
    env["PGPORT"] = str(u.port or 5432)
    env["PGUSER"] = unquote(u.username or "")
    env["PGPASSWORD"] = unquote(u.password or "")
    path = (u.path or "/").strip("/")
    env["PGDATABASE"] = path.split("?")[0].split("/")[0] or "postgres"

    if not env["PGHOST"]:
        print("DATABASE_URL has no host.", file=sys.stderr)
        sys.exit(1)

    argv = sys.argv[1:]
    if not argv:
        argv = ["build"]
    has_project_dir = any(
        a == "--project-dir" or a.startswith("--project-dir=") for a in argv
    )
    if not has_project_dir:
        argv = [*argv, "--project-dir", "dbt"]

    r = subprocess.run(["dbt", *argv], cwd=str(root), env=env)
    sys.exit(r.returncode)


if __name__ == "__main__":
    main()
