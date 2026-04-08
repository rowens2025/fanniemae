
    
    

select
    calendar_month as unique_field,
    count(*) as n_records

from "neondb"."analytics_mart_mortgage"."dim_calendar"
where calendar_month is not null
group by calendar_month
having count(*) > 1


