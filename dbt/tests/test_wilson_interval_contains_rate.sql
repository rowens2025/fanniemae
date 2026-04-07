-- Wilson 95% interval should contain the point estimate p_hat for loan-count delinquency rate.
select
    reporting_month,
    metric_value,
    wilson_95_lo,
    wilson_95_hi,
    binomial_p_hat
from {{ ref('fct_portfolio_metric_significance_monthly') }}
where metric_name = 'delinquency_rate_30_plus'
  and binomial_n_active_loans is not null
  and binomial_n_active_loans > 0
  and wilson_95_lo is not null
  and wilson_95_hi is not null
  and (
      metric_value < wilson_95_lo - 1e-12
      or metric_value > wilson_95_hi + 1e-12
  )
