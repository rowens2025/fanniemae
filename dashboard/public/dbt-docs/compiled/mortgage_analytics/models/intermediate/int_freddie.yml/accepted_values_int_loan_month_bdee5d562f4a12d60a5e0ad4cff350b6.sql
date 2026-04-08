
    
    

with all_values as (

    select
        delinquency_bucket as value_field,
        count(*) as n_records

    from "neondb"."analytics_int_mortgage"."int_loan_monthly_snapshot"
    group by delinquency_bucket

)

select *
from all_values
where value_field not in (
    'current','30_days','60_days','90_plus','reo','zero_balance','unknown','other'
)


