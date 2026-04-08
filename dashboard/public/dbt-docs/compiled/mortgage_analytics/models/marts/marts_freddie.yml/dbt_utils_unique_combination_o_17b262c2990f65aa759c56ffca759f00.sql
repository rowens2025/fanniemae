





with validation_errors as (

    select
        vintage_year, vintage_quarter, vintage_month, reporting_month
    from "neondb"."analytics_mart_mortgage"."fct_vintage_monthly"
    group by vintage_year, vintage_quarter, vintage_month, reporting_month
    having count(*) > 1

)

select *
from validation_errors


