

with snapshots as (
    select *
    from "neondb"."analytics_int_mortgage"."int_loan_monthly_snapshot"
),
aggregated as (
    select
        reporting_month,
        delinquency_bucket,
        count(*) as loan_record_count,
        count(distinct loan_id) as distinct_loan_count,
        sum(current_actual_upb) as total_current_actual_upb,
        avg(current_interest_rate) as avg_current_interest_rate
    from snapshots
    group by 1, 2
),
with_rates as (
    select
        *,
        case
            when sum(distinct_loan_count) over (partition by reporting_month) = 0 then null
            else distinct_loan_count::numeric
                / sum(distinct_loan_count) over (partition by reporting_month)::numeric
        end as loan_share_of_month,
        case
            when sum(total_current_actual_upb) over (partition by reporting_month) = 0 then null
            else total_current_actual_upb::numeric
                / sum(total_current_actual_upb) over (partition by reporting_month)::numeric
        end as upb_share_of_month
    from aggregated
)
select
    reporting_month,
    delinquency_bucket,
    loan_record_count,
    distinct_loan_count,
    total_current_actual_upb,
    avg_current_interest_rate,
    loan_share_of_month,
    upb_share_of_month,
    lag(distinct_loan_count) over (
        partition by delinquency_bucket
        order by reporting_month
    ) as prior_month_distinct_loan_count,
    lag(total_current_actual_upb) over (
        partition by delinquency_bucket
        order by reporting_month
    ) as prior_month_total_current_actual_upb,
    distinct_loan_count
        - lag(distinct_loan_count) over (
            partition by delinquency_bucket
            order by reporting_month
        ) as mom_distinct_loan_count_delta,
    total_current_actual_upb
        - lag(total_current_actual_upb) over (
            partition by delinquency_bucket
            order by reporting_month
        ) as mom_total_current_actual_upb_delta
from with_rates