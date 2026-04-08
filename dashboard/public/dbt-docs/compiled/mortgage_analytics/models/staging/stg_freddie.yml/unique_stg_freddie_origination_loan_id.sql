
    
    

select
    loan_id as unique_field,
    count(*) as n_records

from "neondb"."analytics_stg_mortgage"."stg_freddie_origination"
where loan_id is not null
group by loan_id
having count(*) > 1


