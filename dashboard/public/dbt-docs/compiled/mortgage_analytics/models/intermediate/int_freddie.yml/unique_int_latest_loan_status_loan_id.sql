
    
    

select
    loan_id as unique_field,
    count(*) as n_records

from "neondb"."analytics_int_mortgage"."int_latest_loan_status"
where loan_id is not null
group by loan_id
having count(*) > 1


