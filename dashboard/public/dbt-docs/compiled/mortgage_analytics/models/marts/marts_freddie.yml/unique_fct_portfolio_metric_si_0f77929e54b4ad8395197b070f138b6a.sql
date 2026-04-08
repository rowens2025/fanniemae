
    
    

select
    reporting_month as unique_field,
    count(*) as n_records

from "neondb"."analytics_mart_mortgage"."fct_portfolio_metric_significance_monthly_wide"
where reporting_month is not null
group by reporting_month
having count(*) > 1


