
    
    

select
    metric_name as unique_field,
    count(*) as n_records

from "neondb"."analytics_mart_mortgage"."dim_kpi_metric"
where metric_name is not null
group by metric_name
having count(*) > 1


