{{ config(
    post_hook=[
        "create index if not exists fct_delinquency_rollforward_idx_rm_from_to on {{ this }} (reporting_month, from_delinquency_bucket, to_delinquency_bucket)",
        "create index if not exists fct_delinquency_rollforward_idx_rm_loan_count on {{ this }} (reporting_month desc, loan_count desc)",
    ],
) }}

select
    reporting_month,
    from_delinquency_bucket,
    to_delinquency_bucket,
    loan_count,
    total_current_actual_upb
from {{ ref('int_delinquency_rollforward') }}

