-- Run in Neon SQL Editor after raw load (raw_freddie schema).
-- Proves tables exist, row counts, storage, metadata, and sample rows.

-- 1) Schema and tables
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema = 'raw_freddie'
ORDER BY table_name;

-- 2) Row counts
SELECT 'origination_raw' AS tbl, COUNT(*) AS n FROM raw_freddie.origination_raw
UNION ALL
SELECT 'monthly_performance_raw', COUNT(*) FROM raw_freddie.monthly_performance_raw;

-- 3) Disk footprint (rough)
SELECT pg_size_pretty(pg_total_relation_size('raw_freddie.origination_raw')) AS orig_total;
SELECT pg_size_pretty(pg_total_relation_size('raw_freddie.monthly_performance_raw')) AS perf_total;

-- 4) Rows per source file / quarter
SELECT source_year, source_quarter, source_file_name, COUNT(*) AS n
FROM raw_freddie.origination_raw
GROUP BY 1, 2, 3
ORDER BY 1, 2, 3;

SELECT source_year, source_quarter, source_file_name, COUNT(*) AS n
FROM raw_freddie.monthly_performance_raw
GROUP BY 1, 2, 3
ORDER BY 1, 2, 3;

-- 5) Ingestion timestamps
SELECT MIN(ingested_at) AS first_ingested, MAX(ingested_at) AS last_ingested
FROM raw_freddie.origination_raw;

SELECT MIN(ingested_at) AS first_ingested, MAX(ingested_at) AS last_ingested
FROM raw_freddie.monthly_performance_raw;

-- 6) Distinct loans
SELECT COUNT(DISTINCT loan_sequence_number) AS distinct_loans
FROM raw_freddie.origination_raw;

SELECT COUNT(DISTINCT loan_sequence_number) AS distinct_loans
FROM raw_freddie.monthly_performance_raw;

-- 7) Sample origination
SELECT
    loan_sequence_number,
    credit_score,
    first_payment_date,
    original_upb,
    original_interest_rate,
    product_type,
    property_state,
    source_year,
    source_quarter,
    source_file_name,
    ingested_at
FROM raw_freddie.origination_raw
LIMIT 5;

-- 8) Sample performance (time + delinquency)
SELECT
    loan_sequence_number,
    monthly_reporting_period,
    current_actual_upb,
    current_loan_delinquency_status,
    loan_age,
    source_year,
    source_quarter,
    source_file_name
FROM raw_freddie.monthly_performance_raw
ORDER BY loan_sequence_number, monthly_reporting_period
LIMIT 20;
