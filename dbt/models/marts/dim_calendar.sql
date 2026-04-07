{{ config(
    post_hook=[
        "create unique index if not exists dim_calendar_uidx_calendar_month on {{ this }} (calendar_month)",
    ],
) }}

with months as (
    select distinct
        reporting_month
    from {{ ref('fct_portfolio_monthly') }}
),
enriched as (
    select
        reporting_month as calendar_month,
        extract(year from reporting_month)::int as calendar_year,
        extract(quarter from reporting_month)::int as calendar_quarter,
        extract(month from reporting_month)::int as calendar_month_num,
        to_char(reporting_month, 'YYYY-MM') as year_month
    from months
)
select *
from enriched
