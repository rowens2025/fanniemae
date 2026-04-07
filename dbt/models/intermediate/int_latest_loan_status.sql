{{ config(
    post_hook=[
        "create unique index if not exists int_latest_loan_status_uidx_loan_id on {{ this }} (loan_id)",
    ],
) }}

with snapshots as (
    select *
    from {{ ref('int_loan_monthly_snapshot') }}
),
ranked as (
    select
        *,
        row_number() over (
            partition by loan_id
            order by reporting_month desc
        ) as rn
    from snapshots
)
select
    loan_id,
    reporting_month as latest_reporting_month,
    current_actual_upb,
    delinquency_status_code,
    delinquency_bucket,
    loan_age_months,
    remaining_months_to_legal_maturity,
    repurchase_flag,
    modification_flag,
    zero_balance_code,
    zero_balance_effective_date,
    current_interest_rate,
    current_deferred_upb,
    due_date_last_paid_installment,
    estimated_loan_to_value,
    zero_balance_removal_upb,
    delinquent_accrued_interest,
    delinquency_due_to_disaster,
    borrower_assistance_plan,
    current_month_modification_cost,
    interest_bearing_upb,
    first_payment_date,
    maturity_date,
    credit_score,
    original_upb,
    original_interest_rate,
    original_ltv,
    original_cltv,
    original_dti,
    original_loan_term_months,
    loan_purpose,
    property_state,
    property_type,
    occupancy_status,
    channel,
    seller_name,
    servicer_name,
    source_year,
    source_quarter
from ranked
where rn = 1
