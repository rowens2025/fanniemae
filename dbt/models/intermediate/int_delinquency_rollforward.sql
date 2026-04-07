{{ config(
    post_hook=[
        "create index if not exists int_delinquency_rollforward_idx_rm_from_to on {{ this }} (reporting_month, from_delinquency_bucket, to_delinquency_bucket)",
        "create index if not exists int_delinquency_rollforward_idx_rm_loan_count on {{ this }} (reporting_month desc, loan_count desc)",
    ],
) }}

with snapshots as (
    select *
    from {{ ref('int_loan_monthly_snapshot') }}
)
select
    reporting_month,
    coalesce(prior_delinquency_bucket, 'no_prior') as from_delinquency_bucket,
    delinquency_bucket as to_delinquency_bucket,
    count(*) as loan_count,
    sum(current_actual_upb) as total_current_actual_upb
from snapshots
group by 1, 2, 3
