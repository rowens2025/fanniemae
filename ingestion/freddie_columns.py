"""
Freddie Mac Single-Family Loan-Level Dataset — file column order.

Order matches the pipe-delimited historical origination and monthly performance
files. Verify field definitions against the current Freddie Mac User Guide /
File Layout when upgrading vintage.
"""

# Origination data file (32 fields)
ORIGINATION_COLUMNS: tuple[str, ...] = (
    "credit_score",
    "first_payment_date",
    "first_time_homebuyer_flag",
    "maturity_date",
    "msa_md_code",
    "mortgage_insurance_percentage",
    "number_of_units",
    "occupancy_status",
    "original_cltv",
    "original_dti",
    "original_upb",
    "original_ltv",
    "original_interest_rate",
    "channel",
    "ppm_flag",
    "product_type",
    "property_state",
    "property_type",
    "postal_code",
    "loan_sequence_number",
    "loan_purpose",
    "original_loan_term",
    "number_of_borrowers",
    "seller_name",
    "servicer_name",
    "super_conforming_flag",
    "preharp_loan_identifier",
    "harp_loan_indicator",
    "program_indicator",
    "property_valuation_method",
    "interest_only_indicator",
    "mortgage_insurance_cancellation_indicator",
)

# Monthly performance (time-series) data file (32 fields)
MONTHLY_PERFORMANCE_COLUMNS: tuple[str, ...] = (
    "loan_sequence_number",
    "monthly_reporting_period",
    "current_actual_upb",
    "current_loan_delinquency_status",
    "loan_age",
    "remaining_months_to_legal_maturity",
    "repurchase_flag",
    "modification_flag",
    "zero_balance_code",
    "zero_balance_effective_date",
    "current_interest_rate",
    "current_deferred_upb",
    "due_date_last_paid_installment",
    "mi_recoveries",
    "net_sales_proceeds",
    "non_mi_recoveries",
    "expenses",
    "legal_costs",
    "maintenance_preservation_costs",
    "taxes_and_insurance",
    "miscellaneous_expenses",
    "actual_loss_calculation",
    "modification_cost",
    "step_modification_flag",
    "deferred_payment_plan",
    "estimated_loan_to_value",
    "zero_balance_removal_upb",
    "delinquent_accrued_interest",
    "delinquency_due_to_disaster",
    "borrower_assistance_plan",
    "current_month_modification_cost",
    "interest_bearing_upb",
)

assert len(ORIGINATION_COLUMNS) == 32
assert len(MONTHLY_PERFORMANCE_COLUMNS) == 32
