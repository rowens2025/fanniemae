

with snapshots as (
    select *
    from "neondb"."analytics_int_mortgage"."int_loan_monthly_snapshot"
)
select
    reporting_month,
    coalesce(prior_delinquency_bucket, 'no_prior') as from_delinquency_bucket,
    delinquency_bucket as to_delinquency_bucket,
    count(*) as loan_count,
    sum(current_actual_upb) as total_current_actual_upb
from snapshots
group by 1, 2, 3