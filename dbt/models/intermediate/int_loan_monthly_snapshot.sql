{{
  config(
    materialized='incremental',
    unique_key=['loan_id', 'reporting_month'],
    incremental_strategy='merge',
    post_hook=[
      "create unique index if not exists int_loan_monthly_snapshot_uidx_loan_reporting on {{ this }} (loan_id, reporting_month)",
      "create index if not exists int_loan_monthly_snapshot_idx_reporting_month on {{ this }} (reporting_month)",
      "create index if not exists int_loan_monthly_snapshot_idx_reporting_bucket on {{ this }} (reporting_month, delinquency_bucket)",
      "create index if not exists int_loan_monthly_snapshot_idx_loan_id on {{ this }} (loan_id)",
    ],
  )
}}

{# Optional bounds on performance rows (date strings 'YYYY-MM-DD'). Use for chunked initial loads or backfills. #}
{% set rmin = var('snapshot_reporting_month_start', none) %}
{% set rmax = var('snapshot_reporting_month_end', none) %}

{% if is_incremental() %}

with new_perf as (
    select distinct
        p.loan_id,
        p.reporting_month
    from {{ ref('stg_freddie_monthly_performance') }} as p
    where 1 = 1
    {% if rmin is not none %}
        and p.reporting_month >= to_date('{{ rmin }}', 'YYYY-MM-DD')
    {% endif %}
    {% if rmax is not none %}
        and p.reporting_month <= to_date('{{ rmax }}', 'YYYY-MM-DD')
    {% endif %}
        and not exists (
            select 1
            from {{ this }} as t
            where
                t.loan_id = p.loan_id
                and t.reporting_month = p.reporting_month
        )
),
loan_min_new as (
    select
        loan_id,
        min(reporting_month) as min_new_rm
    from new_perf
    group by loan_id
),
anchor_rows as (
    select
        t.loan_id,
        t.reporting_month,
        t.current_actual_upb,
        t.delinquency_status_code,
        t.loan_age_months,
        t.remaining_months_to_legal_maturity,
        t.repurchase_flag,
        t.modification_flag,
        t.zero_balance_code,
        t.zero_balance_effective_date,
        t.current_interest_rate,
        t.current_deferred_upb,
        t.due_date_last_paid_installment,
        t.estimated_loan_to_value,
        t.zero_balance_removal_upb,
        t.delinquent_accrued_interest,
        t.delinquency_due_to_disaster,
        t.borrower_assistance_plan,
        t.current_month_modification_cost,
        t.interest_bearing_upb,
        t.first_payment_date,
        t.maturity_date,
        t.credit_score,
        t.original_upb,
        t.original_interest_rate,
        t.original_ltv,
        t.original_cltv,
        t.original_dti,
        t.original_loan_term_months,
        t.loan_purpose,
        t.property_state,
        t.property_type,
        t.occupancy_status,
        t.channel,
        t.seller_name,
        t.servicer_name,
        t.source_year,
        t.source_quarter,
        t.delinquency_bucket
    from {{ this }} as t
    inner join loan_min_new as m on t.loan_id = m.loan_id
    where
        t.reporting_month = (
            select max(t2.reporting_month)
            from {{ this }} as t2
            where
                t2.loan_id = m.loan_id
                and t2.reporting_month < m.min_new_rm
        )
),
anchors as (
    select distinct on (loan_id)
        *
    from anchor_rows
    order by
        loan_id,
        source_year desc nulls last,
        source_quarter desc nulls last,
        current_actual_upb desc nulls last
),
perf as (
    select p.*
    from {{ ref('stg_freddie_monthly_performance') }} as p
    inner join new_perf as n using (loan_id, reporting_month)
    where 1 = 1
    {% if rmin is not none %}
        and p.reporting_month >= to_date('{{ rmin }}', 'YYYY-MM-DD')
    {% endif %}
    {% if rmax is not none %}
        and p.reporting_month <= to_date('{{ rmax }}', 'YYYY-MM-DD')
    {% endif %}
),
orig as (
    select *
    from {{ ref('stg_freddie_origination') }}
),
joined_new_raw as (
    select
        perf.loan_id,
        perf.reporting_month,
        perf.current_actual_upb,
        perf.delinquency_status_code,
        perf.loan_age_months,
        perf.remaining_months_to_legal_maturity,
        perf.repurchase_flag,
        perf.modification_flag,
        perf.zero_balance_code,
        perf.zero_balance_effective_date,
        perf.current_interest_rate,
        perf.current_deferred_upb,
        perf.due_date_last_paid_installment,
        perf.estimated_loan_to_value,
        perf.zero_balance_removal_upb,
        perf.delinquent_accrued_interest,
        perf.delinquency_due_to_disaster,
        perf.borrower_assistance_plan,
        perf.current_month_modification_cost,
        perf.interest_bearing_upb,
        orig.first_payment_date,
        orig.maturity_date,
        orig.credit_score,
        orig.original_upb,
        orig.original_interest_rate,
        orig.original_ltv,
        orig.original_cltv,
        orig.original_dti,
        orig.original_loan_term_months,
        orig.loan_purpose,
        orig.property_state,
        orig.property_type,
        orig.occupancy_status,
        orig.channel,
        orig.seller_name,
        orig.servicer_name,
        coalesce(perf.source_year, orig.source_year) as source_year,
        coalesce(perf.source_quarter, orig.source_quarter) as source_quarter,
        case
            when perf.zero_balance_code is not null then 'zero_balance'
            when perf.delinquency_status_code in ('0', '00') then 'current'
            when perf.delinquency_status_code = '1' then '30_days'
            when perf.delinquency_status_code = '2' then '60_days'
            when perf.delinquency_status_code in ('3', '4', '5', '6', '7', '8', '9') then '90_plus'
            when perf.delinquency_status_code = 'R' then 'reo'
            when perf.delinquency_status_code = 'XX' then 'unknown'
            else 'other'
        end as delinquency_bucket
    from perf
    left join orig on perf.loan_id = orig.loan_id
),
joined_new as (
    select distinct on (loan_id, reporting_month)
        *
    from joined_new_raw
    order by
        loan_id,
        reporting_month,
        source_year desc nulls last,
        source_quarter desc nulls last,
        current_actual_upb desc nulls last
),
combined as (
    select * from anchors
    union all
    select * from joined_new
),
enriched as (
    select
        combined.*,
        lag(combined.current_actual_upb) over (
            partition by combined.loan_id
            order by combined.reporting_month
        ) as prior_current_actual_upb,
        lag(combined.delinquency_status_code) over (
            partition by combined.loan_id
            order by combined.reporting_month
        ) as prior_delinquency_status_code,
        lag(combined.delinquency_bucket) over (
            partition by combined.loan_id
            order by combined.reporting_month
        ) as prior_delinquency_bucket
    from combined
)
select enriched.*
from enriched
inner join new_perf as n using (loan_id, reporting_month)

{% else %}

with perf as (
    select *
    from {{ ref('stg_freddie_monthly_performance') }}
    where 1 = 1
    {% if rmin is not none %}
        and reporting_month >= to_date('{{ rmin }}', 'YYYY-MM-DD')
    {% endif %}
    {% if rmax is not none %}
        and reporting_month <= to_date('{{ rmax }}', 'YYYY-MM-DD')
    {% endif %}
),
orig as (
    select *
    from {{ ref('stg_freddie_origination') }}
),
joined_raw as (
    select
        perf.loan_id,
        perf.reporting_month,
        perf.current_actual_upb,
        perf.delinquency_status_code,
        perf.loan_age_months,
        perf.remaining_months_to_legal_maturity,
        perf.repurchase_flag,
        perf.modification_flag,
        perf.zero_balance_code,
        perf.zero_balance_effective_date,
        perf.current_interest_rate,
        perf.current_deferred_upb,
        perf.due_date_last_paid_installment,
        perf.estimated_loan_to_value,
        perf.zero_balance_removal_upb,
        perf.delinquent_accrued_interest,
        perf.delinquency_due_to_disaster,
        perf.borrower_assistance_plan,
        perf.current_month_modification_cost,
        perf.interest_bearing_upb,
        orig.first_payment_date,
        orig.maturity_date,
        orig.credit_score,
        orig.original_upb,
        orig.original_interest_rate,
        orig.original_ltv,
        orig.original_cltv,
        orig.original_dti,
        orig.original_loan_term_months,
        orig.loan_purpose,
        orig.property_state,
        orig.property_type,
        orig.occupancy_status,
        orig.channel,
        orig.seller_name,
        orig.servicer_name,
        coalesce(perf.source_year, orig.source_year) as source_year,
        coalesce(perf.source_quarter, orig.source_quarter) as source_quarter
    from perf
    left join orig on perf.loan_id = orig.loan_id
),
joined as (
    select distinct on (loan_id, reporting_month)
        *
    from joined_raw
    order by
        loan_id,
        reporting_month,
        source_year desc nulls last,
        source_quarter desc nulls last,
        current_actual_upb desc nulls last
),
enriched as (
    select
        joined.*,
        case
            when zero_balance_code is not null then 'zero_balance'
            when delinquency_status_code in ('0', '00') then 'current'
            when delinquency_status_code = '1' then '30_days'
            when delinquency_status_code = '2' then '60_days'
            when delinquency_status_code in ('3', '4', '5', '6', '7', '8', '9') then '90_plus'
            when delinquency_status_code = 'R' then 'reo'
            when delinquency_status_code = 'XX' then 'unknown'
            else 'other'
        end as delinquency_bucket,
        lag(current_actual_upb) over (
            partition by loan_id
            order by reporting_month
        ) as prior_current_actual_upb,
        lag(delinquency_status_code) over (
            partition by loan_id
            order by reporting_month
        ) as prior_delinquency_status_code,
        lag(
            case
                when zero_balance_code is not null then 'zero_balance'
                when delinquency_status_code in ('0', '00') then 'current'
                when delinquency_status_code = '1' then '30_days'
                when delinquency_status_code = '2' then '60_days'
                when delinquency_status_code in ('3', '4', '5', '6', '7', '8', '9') then '90_plus'
                when delinquency_status_code = 'R' then 'reo'
                when delinquency_status_code = 'XX' then 'unknown'
                else 'other'
            end
        ) over (
            partition by loan_id
            order by reporting_month
        ) as prior_delinquency_bucket
    from joined
)
select *
from enriched

{% endif %}
