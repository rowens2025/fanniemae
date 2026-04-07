with source_data as (
    select *
    from {{ source('raw_freddie', 'origination_raw') }}
),
typed as (
    select
        nullif(trim(loan_sequence_number), '') as loan_id,
        case when nullif(trim(credit_score), '') ~ '^[0-9]+$' then trim(credit_score)::int end as credit_score,
        case when nullif(trim(first_payment_date), '') ~ '^[0-9]{6}$' then to_date(trim(first_payment_date), 'YYYYMM') end as first_payment_date,
        nullif(trim(first_time_homebuyer_flag), '') as first_time_homebuyer_flag,
        case when nullif(trim(maturity_date), '') ~ '^[0-9]{6}$' then to_date(trim(maturity_date), 'YYYYMM') end as maturity_date,
        nullif(trim(msa_md_code), '') as msa_md_code,
        case when nullif(trim(mortgage_insurance_percentage), '') ~ '^[0-9]+(\.[0-9]+)?$' then trim(mortgage_insurance_percentage)::numeric(10,4) end as mortgage_insurance_pct,
        case when nullif(trim(number_of_units), '') ~ '^[0-9]+$' then trim(number_of_units)::int end as number_of_units,
        nullif(trim(occupancy_status), '') as occupancy_status,
        case when nullif(trim(original_cltv), '') ~ '^[0-9]+(\.[0-9]+)?$' then trim(original_cltv)::numeric(10,4) end as original_cltv,
        case when nullif(trim(original_dti), '') ~ '^[0-9]+(\.[0-9]+)?$' then trim(original_dti)::numeric(10,4) end as original_dti,
        case when nullif(trim(original_upb), '') ~ '^[0-9]+$' then trim(original_upb)::bigint end as original_upb,
        case when nullif(trim(original_ltv), '') ~ '^[0-9]+(\.[0-9]+)?$' then trim(original_ltv)::numeric(10,4) end as original_ltv,
        case when nullif(trim(original_interest_rate), '') ~ '^[0-9]+(\.[0-9]+)?$' then trim(original_interest_rate)::numeric(10,4) end as original_interest_rate,
        nullif(trim(channel), '') as channel,
        nullif(trim(ppm_flag), '') as ppm_flag,
        nullif(trim(product_type), '') as product_type,
        nullif(trim(property_state), '') as property_state,
        nullif(trim(property_type), '') as property_type,
        nullif(trim(postal_code), '') as postal_code,
        nullif(trim(loan_purpose), '') as loan_purpose,
        case when nullif(trim(original_loan_term), '') ~ '^[0-9]+$' then trim(original_loan_term)::int end as original_loan_term_months,
        case when nullif(trim(number_of_borrowers), '') ~ '^[0-9]+$' then trim(number_of_borrowers)::int end as number_of_borrowers,
        nullif(trim(seller_name), '') as seller_name,
        nullif(trim(servicer_name), '') as servicer_name,
        nullif(trim(super_conforming_flag), '') as super_conforming_flag,
        nullif(trim(preharp_loan_identifier), '') as preharp_loan_identifier,
        nullif(trim(harp_loan_indicator), '') as harp_loan_indicator,
        nullif(trim(program_indicator), '') as program_indicator,
        nullif(trim(property_valuation_method), '') as property_valuation_method,
        nullif(trim(interest_only_indicator), '') as interest_only_indicator,
        nullif(trim(mortgage_insurance_cancellation_indicator), '') as mortgage_insurance_cancellation_indicator,
        source_year,
        source_quarter,
        source_file_name,
        source_folder,
        ingested_at
    from source_data
),
-- One row per loan_id. Freddie quarterly origination files can repeat the same loan;
-- prefer the latest source file (year/quarter, then ingest time). Matches dim_loan grain.
ranked as (
    select
        *,
        row_number() over (
            partition by loan_id
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
    credit_score,
    first_payment_date,
    first_time_homebuyer_flag,
    maturity_date,
    msa_md_code,
    mortgage_insurance_pct,
    number_of_units,
    occupancy_status,
    original_cltv,
    original_dti,
    original_upb,
    original_ltv,
    original_interest_rate,
    channel,
    ppm_flag,
    product_type,
    property_state,
    property_type,
    postal_code,
    loan_purpose,
    original_loan_term_months,
    number_of_borrowers,
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
    source_file_name,
    source_folder,
    ingested_at
from ranked
where _rn = 1
