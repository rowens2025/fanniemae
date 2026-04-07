"""Manual-only dbt run for mortgage marts (no raw-folder detection). Trigger from the UI."""
from __future__ import annotations

from datetime import datetime

from airflow.decorators import dag
from airflow.providers.standard.operators.bash import BashOperator


@dag(
    dag_id="fannie_mortgage_dbt_manual",
    schedule=None,
    start_date=datetime(2025, 1, 1),
    catchup=False,
    tags=["fannie", "dbt", "mortgage", "manual"],
    default_args={"owner": "mortgage_analytics", "retries": 0},
)
def fannie_mortgage_dbt_manual():
    BashOperator(
        task_id="dbt_run_marts_downstream",
        bash_command="""
set -euo pipefail
cd "${FANNIE_PROJECT_ROOT:-/opt/project}"
python scripts/dbt_with_env.py run --select int_loan_monthly_snapshot+ dim_loan dim_delinquency_bucket dim_kpi_metric
""",
    )


fannie_mortgage_dbt_manual()
