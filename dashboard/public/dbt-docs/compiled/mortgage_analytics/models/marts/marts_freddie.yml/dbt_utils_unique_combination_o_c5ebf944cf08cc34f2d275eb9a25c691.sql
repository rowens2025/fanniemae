





with validation_errors as (

    select
        reporting_month, delinquency_bucket
    from "neondb"."analytics_mart_mortgage"."fct_portfolio_monthly"
    group by reporting_month, delinquency_bucket
    having count(*) > 1

)

select *
from validation_errors


