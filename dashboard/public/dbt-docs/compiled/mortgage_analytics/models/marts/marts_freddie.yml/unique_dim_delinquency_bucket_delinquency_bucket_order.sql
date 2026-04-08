
    
    

select
    delinquency_bucket_order as unique_field,
    count(*) as n_records

from "neondb"."analytics_mart_mortgage"."dim_delinquency_bucket"
where delinquency_bucket_order is not null
group by delinquency_bucket_order
having count(*) > 1


