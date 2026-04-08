
    
    

with child as (
    select metric_name as from_field
    from "neondb"."analytics_mart_mortgage"."fct_portfolio_metric_significance_monthly"
    where metric_name is not null
),

parent as (
    select metric_name as to_field
    from "neondb"."analytics_mart_mortgage"."dim_kpi_metric"
)

select
    from_field

from child
left join parent
    on child.from_field = parent.to_field

where parent.to_field is null


