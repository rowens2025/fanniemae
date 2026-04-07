{{ config(
    post_hook=[
        "create unique index if not exists fct_portfolio_monthly_kpis_uidx_reporting_month on {{ this }} (reporting_month)",
    ],
) }}

with bucketed as (
    select *
    from {{ ref('fct_portfolio_monthly') }}
),
overall as (
    select
        reporting_month,
        sum(case when delinquency_bucket != 'zero_balance' then distinct_loan_count else 0 end) as active_loan_count,
        sum(case when delinquency_bucket in ('30_days', '60_days', '90_plus', 'reo')
                 and delinquency_bucket != 'zero_balance' then distinct_loan_count else 0 end) as delinq_30plus_loan_count,
        sum(case when delinquency_bucket != 'zero_balance' then total_current_actual_upb else 0 end) as active_upb,
        sum(case when delinquency_bucket in ('30_days', '60_days', '90_plus', 'reo')
                 and delinquency_bucket != 'zero_balance' then total_current_actual_upb else 0 end) as delinq_30plus_upb
    from bucketed
    group by 1
),
rates as (
    select
        reporting_month,
        active_loan_count,
        delinq_30plus_loan_count,
        case
            when active_loan_count = 0 then null
            else delinq_30plus_loan_count::numeric / active_loan_count::numeric
        end as delinquency_rate_30_plus,
        active_upb,
        delinq_30plus_upb,
        case
            when active_upb = 0 then null
            else delinq_30plus_upb::numeric / active_upb::numeric
        end as delinquency_upb_rate_30_plus
    from overall
),
mom as (
    select
        *,
        lag(delinquency_rate_30_plus) over (order by reporting_month) as prior_delinq_rate_30_plus,
        delinquency_rate_30_plus
            - lag(delinquency_rate_30_plus) over (order by reporting_month) as mom_delinq_rate_30_plus_delta,
        lag(delinquency_upb_rate_30_plus) over (order by reporting_month) as prior_delinq_upb_rate_30_plus,
        delinquency_upb_rate_30_plus
            - lag(delinquency_upb_rate_30_plus) over (order by reporting_month) as mom_delinq_upb_rate_30_plus_delta
    from rates
),
roll as (
    select
        *,
        avg(delinquency_rate_30_plus) over (
            order by reporting_month
            rows between 11 preceding and current row
        ) as rolling_avg_12m_delinq_rate_30_plus,
        stddev_samp(delinquency_rate_30_plus) over (
            order by reporting_month
            rows between 11 preceding and current row
        ) as rolling_stddev_12m_delinq_rate_30_plus
    from mom
)
select
    *,
    case
        when rolling_stddev_12m_delinq_rate_30_plus is null or rolling_stddev_12m_delinq_rate_30_plus = 0 then null
        else (delinquency_rate_30_plus - rolling_avg_12m_delinq_rate_30_plus)
             / rolling_stddev_12m_delinq_rate_30_plus
    end as zscore_delinq_rate_30_plus
from roll
