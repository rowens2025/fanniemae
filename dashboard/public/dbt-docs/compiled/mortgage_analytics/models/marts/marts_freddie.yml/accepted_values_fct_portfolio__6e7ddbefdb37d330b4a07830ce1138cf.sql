
    
    

with all_values as (

    select
        recommended_method as value_field,
        count(*) as n_records

    from (select * from "neondb"."analytics_mart_mortgage"."fct_portfolio_metric_significance_monthly" where rn >= 12 and metric_value is not null) dbt_subquery
    group by recommended_method

)

select *
from all_values
where value_field not in (
    'classic_z','robust_z','percentile_rank'
)


