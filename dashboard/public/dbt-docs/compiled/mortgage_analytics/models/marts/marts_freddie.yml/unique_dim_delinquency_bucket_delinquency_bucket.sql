
    
    

select
    delinquency_bucket as unique_field,
    count(*) as n_records

from "neondb"."analytics_mart_mortgage"."dim_delinquency_bucket"
where delinquency_bucket is not null
group by delinquency_bucket
having count(*) > 1


