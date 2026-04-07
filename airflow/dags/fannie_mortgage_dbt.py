"""
Mortgage analytics: detect new Fannie Mae raw quarter folders under data/raw, then run dbt.

Raw layout (repo): data/raw/historical_data_<YEAR>/historical_data_<YEAR>Q<N>/

Airflow Variable FANNIE_RAW_MAX_QUARTER stores the last quarter we treated as processed
(e.g. 2024Q3). First successful check seeds it to the current max without running dbt;
when a newer quarter folder appears, dbt runs and the variable is updated on success.

Trigger with JSON conf {"force": true} to run dbt regardless of quarter detection.
"""
from __future__ import annotations

import os
import re
from datetime import datetime, timedelta
from pathlib import Path

from airflow.decorators import dag
from airflow.models import Variable
from airflow.providers.standard.operators.bash import BashOperator
from airflow.providers.standard.operators.python import PythonOperator

try:
    from airflow.providers.standard.operators.python import ShortCircuitOperator
except ImportError:
    from airflow.operators.python import ShortCircuitOperator  # type: ignore[no-redef]


def _project_root() -> Path:
    return Path(os.environ.get("FANNIE_PROJECT_ROOT", "/opt/project")).resolve()


def _quarter_key(q: str) -> tuple[int, int]:
    m = re.fullmatch(r"(\d{4})Q([1-4])", q)
    if not m:
        return (0, 0)
    return (int(m.group(1)), int(m.group(2)))


def discover_max_quarter(project_root: Path) -> str | None:
    raw = project_root / "data" / "raw"
    if not raw.is_dir():
        return None
    best: str | None = None
    for year_dir in sorted(raw.glob("historical_data_*")):
        if not year_dir.is_dir():
            continue
        for qdir in year_dir.glob("historical_data_*"):
            if not qdir.is_dir():
                continue
            m = re.fullmatch(r"historical_data_(\d{4})Q([1-4])", qdir.name)
            if not m:
                continue
            qid = f"{m.group(1)}Q{m.group(2)}"
            if best is None or _quarter_key(qid) > _quarter_key(best):
                best = qid
    return best


def should_run_dbt(**context) -> bool:
    dag_run = context.get("dag_run")
    conf = (dag_run.conf or {}) if dag_run else {}
    if conf.get("force") is True:
        return True

    root = _project_root()
    max_q = discover_max_quarter(root)
    if not max_q:
        return False

    try:
        last = Variable.get("FANNIE_RAW_MAX_QUARTER")
    except KeyError:
        Variable.set("FANNIE_RAW_MAX_QUARTER", max_q)
        return False

    return _quarter_key(max_q) > _quarter_key(last)


def mark_quarter_processed(**context) -> None:
    max_q = discover_max_quarter(_project_root())
    if max_q:
        Variable.set("FANNIE_RAW_MAX_QUARTER", max_q)


@dag(
    dag_id="fannie_mortgage_dbt_on_new_raw_quarter",
    schedule=timedelta(days=1),
    start_date=datetime(2025, 1, 1),
    catchup=False,
    tags=["fannie", "dbt", "mortgage"],
    doc_md=__doc__,
    default_args={
        "owner": "mortgage_analytics",
        "retries": 1,
        "retry_delay": timedelta(minutes=10),
    },
)
def fannie_mortgage_dbt_on_new_raw_quarter():
    gate = ShortCircuitOperator(
        task_id="new_raw_quarter_or_force",
        python_callable=should_run_dbt,
    )

    run_dbt = BashOperator(
        task_id="dbt_run_marts_downstream",
        bash_command="""
set -euo pipefail
cd "${FANNIE_PROJECT_ROOT:-/opt/project}"
python scripts/dbt_with_env.py run --select int_loan_monthly_snapshot+ dim_loan dim_delinquency_bucket dim_kpi_metric
""",
    )

    stamp = PythonOperator(
        task_id="mark_raw_quarter_processed",
        python_callable=mark_quarter_processed,
    )

    gate >> run_dbt >> stamp


fannie_mortgage_dbt_on_new_raw_quarter()
