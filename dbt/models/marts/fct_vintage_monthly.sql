{{ config(
    post_hook=[
        "create unique index if not exists fct_vintage_monthly_uidx_grain on {{ this }} (vintage_year, vintage_quarter, vintage_month, reporting_month)",
        "create index if not exists fct_vintage_monthly_idx_reporting_month on {{ this }} (reporting_month)",
    ],
) }}

with snapshots as (
    select *
    from {{ ref('int_loan_monthly_snapshot') }}
),
cohorts as (
    select
        loan_id,
        reporting_month,
        source_year as vintage_year,
        source_quarter as vintage_quarter,
        delinquency_bucket,
        current_actual_upb,
        zero_balance_code,
        -- cohort quarter start month: Q1->Jan (1), Q2->Apr (4), Q3->Jul (7), Q4->Oct (10)
        make_date(
            source_year,
            ((source_quarter - 1) * 3 + 1)::int,
            1
        ) as vintage_quarter_start
    from snapshots
),
scored as (
    select
        *,
        (
            (extract(year from reporting_month)::int - extract(year from vintage_quarter_start)::int) * 12
            + (extract(month from reporting_month)::int - extract(month from vintage_quarter_start)::int)
        )::int as vintage_month
    from cohorts
),
agg as (
    select
        vintage_year,
        vintage_quarter,
        vintage_month,
        reporting_month,
        count(*) as loan_record_count,
        count(distinct loan_id) as distinct_loan_count,
        sum(current_actual_upb) as total_current_actual_upb,
        sum(case when zero_balance_code is null then 1 else 0 end) as active_loan_records,
        sum(case when zero_balance_code is null then current_actual_upb else 0 end) as active_upb,
        sum(case when zero_balance_code is null and delinquency_bucket in ('30_days', '60_days', '90_plus', 'reo') then 1 else 0 end) as delinq_30plus_loan_records,
        sum(case when zero_balance_code is null and delinquency_bucket in ('30_days', '60_days', '90_plus', 'reo') then current_actual_upb else 0 end) as delinq_30plus_upb
    from scored
    group by 1, 2, 3, 4
)
select
    vintage_year,
    vintage_quarter,
    vintage_month,
    reporting_month,
    distinct_loan_count,
    total_current_actual_upb,
    delinq_30plus_loan_records,
    active_loan_records,
    case
        when active_loan_records = 0 then null
        else delinq_30plus_loan_records::numeric / active_loan_records::numeric
    end as delinquency_rate_30_plus,
    delinq_30plus_upb,
    active_upb,
    case
        when active_upb = 0 then null
        else delinq_30plus_upb::numeric / active_upb::numeric
    end as delinquency_upb_rate_30_plus
from agg
