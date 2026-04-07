select
    s.reporting_month,
    s.metric_name
from {{ ref('fct_portfolio_metric_significance_monthly') }} s
left join {{ ref('dim_kpi_metric') }} d
    on s.metric_name = d.metric_name
where d.metric_name is null
