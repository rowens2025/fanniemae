
    
    

with child as (
    select delinquency_bucket as from_field
    from "neondb"."analytics_mart_mortgage"."fct_portfolio_monthly"
    where delinquency_bucket is not null
),

parent as (
    select delinquency_bucket as to_field
    from "neondb"."analytics_mart_mortgage"."dim_delinquency_bucket"
)

select
    from_field

from child
left join parent
    on child.from_field = parent.to_field

where parent.to_field is null


