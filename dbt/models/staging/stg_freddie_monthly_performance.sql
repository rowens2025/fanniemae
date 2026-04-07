with source_data as (
    select *
    from {{ source('raw_freddie', 'monthly_performance_raw') }}
),
typed as (
    select
        nullif(trim(loan_sequence_number), '') as loan_id,
        case when nullif(trim(monthly_reporting_period), '') ~ '^[0-9]{6}$' then to_date(trim(monthly_reporting_period), 'YYYYMM') end as reporting_month,
        case when nullif(trim(current_actual_upb), '') ~ '^[0-9]+(\.[0-9]+)?$' then trim(current_actual_upb)::numeric(18,2) end as current_actual_upb,
        nullif(trim(current_loan_delinquency_status), '') as delinquency_status_code,
        case when nullif(trim(loan_age), '') ~ '^[0-9]+$' then trim(loan_age)::int end as loan_age_months,
        case when nullif(trim(remaining_months_to_legal_maturity), '') ~ '^[0-9]+$' then trim(remaining_months_to_legal_maturity)::int end as remaining_months_to_legal_maturity,
        nullif(trim(repurchase_flag), '') as repurchase_flag,
        nullif(trim(modification_flag), '') as modification_flag,
        nullif(trim(zero_balance_code), '') as zero_balance_code,
        case when nullif(trim(zero_balance_effective_date), '') ~ '^[0-9]{6}$' then to_date(trim(zero_balance_effective_date), 'YYYYMM') end as zero_balance_effective_date,
        case when nullif(trim(current_interest_rate), '') ~ '^[0-9]+(\.[0-9]+)?$' then trim(current_interest_rate)::numeric(10,4) end as current_interest_rate,
        case when nullif(trim(current_deferred_upb), '') ~ '^[0-9]+(\.[0-9]+)?$' then trim(current_deferred_upb)::numeric(18,2) end as current_deferred_upb,
        case when nullif(trim(due_date_last_paid_installment), '') ~ '^[0-9]{6}$' then to_date(trim(due_date_last_paid_installment), 'YYYYMM') end as due_date_last_paid_installment,
        nullif(trim(mi_recoveries), '') as mi_recoveries_raw,
        nullif(trim(net_sales_proceeds), '') as net_sales_proceeds_raw,
        nullif(trim(non_mi_recoveries), '') as non_mi_recoveries_raw,
        case when nullif(trim(expenses), '') ~ '^[0-9]+(\.[0-9]+)?$' then trim(expenses)::numeric(18,2) end as expenses,
        case when nullif(trim(legal_costs), '') ~ '^[0-9]+(\.[0-9]+)?$' then trim(legal_costs)::numeric(18,2) end as legal_costs,
        case when nullif(trim(maintenance_preservation_costs), '') ~ '^[0-9]+(\.[0-9]+)?$' then trim(maintenance_preservation_costs)::numeric(18,2) end as maintenance_preservation_costs,
        case when nullif(trim(taxes_and_insurance), '') ~ '^[0-9]+(\.[0-9]+)?$' then trim(taxes_and_insurance)::numeric(18,2) end as taxes_and_insurance,
        case when nullif(trim(miscellaneous_expenses), '') ~ '^[0-9]+(\.[0-9]+)?$' then trim(miscellaneous_expenses)::numeric(18,2) end as miscellaneous_expenses,
        case when nullif(trim(actual_loss_calculation), '') ~ '^[0-9]+(\.[0-9]+)?$' then trim(actual_loss_calculation)::numeric(18,2) end as actual_loss_calculation,
        case when nullif(trim(modification_cost), '') ~ '^[0-9]+(\.[0-9]+)?$' then trim(modification_cost)::numeric(18,2) end as modification_cost,
        nullif(trim(step_modification_flag), '') as step_modification_flag,
        nullif(trim(deferred_payment_plan), '') as deferred_payment_plan,
        case when nullif(trim(estimated_loan_to_value), '') ~ '^[0-9]+(\.[0-9]+)?$' then trim(estimated_loan_to_value)::numeric(10,4) end as estimated_loan_to_value,
        case when nullif(trim(zero_balance_removal_upb), '') ~ '^[0-9]+(\.[0-9]+)?$' then trim(zero_balance_removal_upb)::numeric(18,2) end as zero_balance_removal_upb,
        case when nullif(trim(delinquent_accrued_interest), '') ~ '^[0-9]+(\.[0-9]+)?$' then trim(delinquent_accrued_interest)::numeric(18,2) end as delinquent_accrued_interest,
        nullif(trim(delinquency_due_to_disaster), '') as delinquency_due_to_disaster,
        nullif(trim(borrower_assistance_plan), '') as borrower_assistance_plan,
        case when nullif(trim(current_month_modification_cost), '') ~ '^[0-9]+(\.[0-9]+)?$' then trim(current_month_modification_cost)::numeric(18,2) end as current_month_modification_cost,
        case when nullif(trim(interest_bearing_upb), '') ~ '^[0-9]+(\.[0-9]+)?$' then trim(interest_bearing_upb)::numeric(18,2) end as interest_bearing_upb,
        source_year,
        source_quarter,
        source_file_name,
        source_folder,
        ingested_at
    from source_data
),
-- One row per (loan_id, reporting_month). Overlapping Freddie file loads can duplicate;
-- prefer the latest source file (year/quarter, then ingest time).
ranked as (
    select
        *,
        row_number() over (
            partition by loan_id, reporting_month
            order by
                source_year desc,
                source_quarter desc,
                ingested_at desc nulls last,
                source_file_name desc nulls last
        ) as _rn
    from typed
)
select
    loan_id,
    reporting_month,
    current_actual_upb,
    delinquency_status_code,
    loan_age_months,
    remaining_months_to_legal_maturity,
    repurchase_flag,
    modification_flag,
    zero_balance_code,
    zero_balance_effective_date,
    current_interest_rate,
    current_deferred_upb,
    due_date_last_paid_installment,
    mi_recoveries_raw,
    net_sales_proceeds_raw,
    non_mi_recoveries_raw,
    expenses,
    legal_costs,
    maintenance_preservation_costs,
    taxes_and_insurance,
    miscellaneous_expenses,
    actual_loss_calculation,
    modification_cost,
    step_modification_flag,
    deferred_payment_plan,
    estimated_loan_to_value,
    zero_balance_removal_upb,
    delinquent_accrued_interest,
    delinquency_due_to_disaster,
    borrower_assistance_plan,
    current_month_modification_cost,
    interest_bearing_upb,
    source_year,
    source_quarter,
    source_file_name,
    source_folder,
    ingested_at
from ranked
where _rn = 1
