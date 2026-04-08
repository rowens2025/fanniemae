
    
    

with all_values as (

    select
        source_quarter as value_field,
        count(*) as n_records

    from "neondb"."raw_freddie"."monthly_performance_raw"
    group by source_quarter

)

select *
from all_values
where value_field not in (
    '1','2','3','4'
)


