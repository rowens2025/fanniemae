





with validation_errors as (

    select
        loan_id, reporting_month
    from "neondb"."analytics_int_mortgage"."int_loan_monthly_snapshot"
    group by loan_id, reporting_month
    having count(*) > 1

)

select *
from validation_errors


