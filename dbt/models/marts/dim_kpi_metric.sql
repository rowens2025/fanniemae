select *
from (
    values
        ('active_loan_count', 'count', 'Total active loans (excludes zero-balance).', 1),
        ('delinq_30plus_loan_count', 'count', 'Total loans 30+ delinquent (excludes zero-balance).', 2),
        ('delinquency_rate_30_plus', 'rate', 'delinq_30plus_loan_count / active_loan_count.', 3),
        ('active_upb', 'currency', 'Total active UPB (excludes zero-balance).', 4),
        ('delinq_30plus_upb', 'currency', 'Total UPB for loans 30+ delinquent (excludes zero-balance).', 5),
        ('delinquency_upb_rate_30_plus', 'rate', 'delinq_30plus_upb / active_upb.', 6)
) as metrics(metric_name, metric_unit_type, metric_description, metric_order)
