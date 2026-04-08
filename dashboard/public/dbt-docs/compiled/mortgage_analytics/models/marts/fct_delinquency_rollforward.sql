

select
    reporting_month,
    from_delinquency_bucket,
    to_delinquency_bucket,
    loan_count,
    total_current_actual_upb
from "neondb"."analytics_int_mortgage"."int_delinquency_rollforward"