with scored as (
    select
        reporting_month,
        metric_name,
        trailing_12m_stddev,
        row_number() over (
            partition by metric_name
            order by reporting_month
        ) as rn
    from "neondb"."analytics_mart_mortgage"."fct_portfolio_metric_significance_monthly"
)
select
    reporting_month,
    metric_name,
    rn,
    trailing_12m_stddev
from scored
where rn >= 12
  and trailing_12m_stddev is null