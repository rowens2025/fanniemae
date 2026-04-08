





with validation_errors as (

    select
        reporting_month, metric_name
    from "neondb"."analytics_mart_mortgage"."fct_portfolio_metric_significance_monthly"
    group by reporting_month, metric_name
    having count(*) > 1

)

select *
from validation_errors


