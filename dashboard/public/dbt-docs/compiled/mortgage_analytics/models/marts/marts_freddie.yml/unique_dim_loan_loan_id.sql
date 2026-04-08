
    
    

select
    loan_id as unique_field,
    count(*) as n_records

from "neondb"."analytics_mart_mortgage"."dim_loan"
where loan_id is not null
group by loan_id
having count(*) > 1


