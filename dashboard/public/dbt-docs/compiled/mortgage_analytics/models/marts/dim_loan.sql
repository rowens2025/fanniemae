

-- One row per loan_id. Freddie quarterly origination files can repeat the same loan;
-- prefer the latest source file (year/quarter) when duplicates exist.
with ranked as (
    select
        loan_id,
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
        super_conforming_flag,
        preharp_loan_identifier,
        harp_loan_indicator,
        program_indicator,
        property_valuation_method,
        interest_only_indicator,
        mortgage_insurance_cancellation_indicator,
        source_year,
        source_quarter,
        ingested_at,
        row_number() over (
            partition by loan_id
            order by source_year desc, source_quarter desc, ingested_at desc nulls last
        ) as _rn
    from "neondb"."analytics_stg_mortgage"."stg_freddie_origination"
    where loan_id is not null
)
select
    loan_id,
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
    super_conforming_flag,
    preharp_loan_identifier,
    harp_loan_indicator,
    program_indicator,
    property_valuation_method,
    interest_only_indicator,
    mortgage_insurance_cancellation_indicator,
    source_year as origination_year,
    source_quarter as origination_quarter,
    ingested_at
from ranked
where _rn = 1