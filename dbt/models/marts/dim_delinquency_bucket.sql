select *
from (
    values
        ('current', 1, 'Loan is current (0-29 days past due).'),
        ('30_days', 2, 'Loan is 30-59 days delinquent.'),
        ('60_days', 3, 'Loan is 60-89 days delinquent.'),
        ('90_plus', 4, 'Loan is 90+ days delinquent.'),
        ('reo', 5, 'Real-estate-owned status code from source.'),
        ('zero_balance', 6, 'Loan has a zero-balance removal code.'),
        ('unknown', 7, 'Source code marked unknown.'),
        ('other', 8, 'Any code outside the standardized mapping.')
) as buckets(delinquency_bucket, delinquency_bucket_order, delinquency_bucket_description)
