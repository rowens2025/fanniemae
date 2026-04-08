with expected as (
    select count(*)::int as expected_metric_count
    from "neondb"."analytics_mart_mortgage"."dim_kpi_metric"
),
actual as (
    select
        reporting_month,
        count(distinct metric_name)::int as actual_metric_count
    from "neondb"."analytics_mart_mortgage"."fct_portfolio_metric_significance_monthly"
    group by 1
)
select
    a.reporting_month,
    a.actual_metric_count,
    e.expected_metric_count
from actual a
cross join expected e
where a.actual_metric_count <> e.expected_metric_count