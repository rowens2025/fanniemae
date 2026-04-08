





with validation_errors as (

    select
        loan_id, reporting_month
    from "neondb"."analytics_stg_mortgage"."stg_freddie_monthly_performance"
    group by loan_id, reporting_month
    having count(*) > 1

)

select *
from validation_errors


