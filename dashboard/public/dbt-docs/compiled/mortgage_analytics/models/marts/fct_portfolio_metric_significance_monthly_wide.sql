

with long as (
    select *
    from "neondb"."analytics_mart_mortgage"."fct_portfolio_metric_significance_monthly"
)
select
    reporting_month,
    -- values
    max(case when metric_name = 'active_loan_count' then metric_value end) as active_loan_count,
    max(case when metric_name = 'delinq_30plus_loan_count' then metric_value end) as delinq_30plus_loan_count,
    max(case when metric_name = 'delinquency_rate_30_plus' then metric_value end) as delinquency_rate_30_plus,
    max(case when metric_name = 'delinquency_rate_30_plus' then wilson_95_lo end) as wilson_95_lo_delinquency_rate_30_plus,
    max(case when metric_name = 'delinquency_rate_30_plus' then wilson_95_hi end) as wilson_95_hi_delinquency_rate_30_plus,
    max(case when metric_name = 'delinquency_rate_30_plus' then binomial_n_active_loans end) as binomial_n_active_loans_delinquency_rate,
    max(case when metric_name = 'delinquency_rate_30_plus' then binomial_x_delinq_loans end) as binomial_x_delinq_loans_delinquency_rate,
    max(case when metric_name = 'active_upb' then metric_value end) as active_upb,
    max(case when metric_name = 'delinq_30plus_upb' then metric_value end) as delinq_30plus_upb,
    max(case when metric_name = 'delinquency_upb_rate_30_plus' then metric_value end) as delinquency_upb_rate_30_plus,
    max(case when metric_name = 'delinquency_upb_rate_30_plus' then upb_rate_normal_approx_95_lo end) as upb_rate_normal_approx_95_lo,
    max(case when metric_name = 'delinquency_upb_rate_30_plus' then upb_rate_normal_approx_95_hi end) as upb_rate_normal_approx_95_hi,

    -- mom deltas + pct changes
    max(case when metric_name = 'active_loan_count' then mom_delta end) as mom_delta_active_loan_count,
    max(case when metric_name = 'delinq_30plus_loan_count' then mom_delta end) as mom_delta_delinq_30plus_loan_count,
    max(case when metric_name = 'delinquency_rate_30_plus' then mom_delta end) as mom_delta_delinquency_rate_30_plus,
    max(case when metric_name = 'active_upb' then mom_delta end) as mom_delta_active_upb,
    max(case when metric_name = 'delinq_30plus_upb' then mom_delta end) as mom_delta_delinq_30plus_upb,
    max(case when metric_name = 'delinquency_upb_rate_30_plus' then mom_delta end) as mom_delta_delinquency_upb_rate_30_plus,

    max(case when metric_name = 'active_loan_count' then mom_pct_change end) as mom_pct_change_active_loan_count,
    max(case when metric_name = 'delinq_30plus_loan_count' then mom_pct_change end) as mom_pct_change_delinq_30plus_loan_count,
    max(case when metric_name = 'delinquency_rate_30_plus' then mom_pct_change end) as mom_pct_change_delinquency_rate_30_plus,
    max(case when metric_name = 'active_upb' then mom_pct_change end) as mom_pct_change_active_upb,
    max(case when metric_name = 'delinq_30plus_upb' then mom_pct_change end) as mom_pct_change_delinq_30plus_upb,
    max(case when metric_name = 'delinquency_upb_rate_30_plus' then mom_pct_change end) as mom_pct_change_delinquency_upb_rate_30_plus,

    -- yoy deltas + pct changes
    max(case when metric_name = 'active_loan_count' then yoy_delta end) as yoy_delta_active_loan_count,
    max(case when metric_name = 'delinq_30plus_loan_count' then yoy_delta end) as yoy_delta_delinq_30plus_loan_count,
    max(case when metric_name = 'delinquency_rate_30_plus' then yoy_delta end) as yoy_delta_delinquency_rate_30_plus,
    max(case when metric_name = 'active_upb' then yoy_delta end) as yoy_delta_active_upb,
    max(case when metric_name = 'delinq_30plus_upb' then yoy_delta end) as yoy_delta_delinq_30plus_upb,
    max(case when metric_name = 'delinquency_upb_rate_30_plus' then yoy_delta end) as yoy_delta_delinquency_upb_rate_30_plus,

    max(case when metric_name = 'active_loan_count' then yoy_pct_change end) as yoy_pct_change_active_loan_count,
    max(case when metric_name = 'delinq_30plus_loan_count' then yoy_pct_change end) as yoy_pct_change_delinq_30plus_loan_count,
    max(case when metric_name = 'delinquency_rate_30_plus' then yoy_pct_change end) as yoy_pct_change_delinquency_rate_30_plus,
    max(case when metric_name = 'active_upb' then yoy_pct_change end) as yoy_pct_change_active_upb,
    max(case when metric_name = 'delinq_30plus_upb' then yoy_pct_change end) as yoy_pct_change_delinq_30plus_upb,
    max(case when metric_name = 'delinquency_upb_rate_30_plus' then yoy_pct_change end) as yoy_pct_change_delinquency_upb_rate_30_plus,

    -- zscores + significance flags
    max(case when metric_name = 'delinquency_rate_30_plus' then zscore_12m end) as zscore_delinquency_rate_30_plus,
    bool_or(case when metric_name = 'delinquency_rate_30_plus' then is_2sd_outlier end) as is_2sd_outlier_delinquency_rate_30_plus,
    max(case when metric_name = 'delinquency_upb_rate_30_plus' then zscore_12m end) as zscore_delinquency_upb_rate_30_plus,
    bool_or(case when metric_name = 'delinquency_upb_rate_30_plus' then is_2sd_outlier end) as is_2sd_outlier_delinquency_upb_rate_30_plus,

    max(case when metric_name = 'active_loan_count' then zscore_12m end) as zscore_active_loan_count,
    bool_or(case when metric_name = 'active_loan_count' then is_2sd_outlier end) as is_2sd_outlier_active_loan_count,
    max(case when metric_name = 'delinq_30plus_loan_count' then zscore_12m end) as zscore_delinq_30plus_loan_count,
    bool_or(case when metric_name = 'delinq_30plus_loan_count' then is_2sd_outlier end) as is_2sd_outlier_delinq_30plus_loan_count,
    max(case when metric_name = 'active_upb' then zscore_12m end) as zscore_active_upb,
    bool_or(case when metric_name = 'active_upb' then is_2sd_outlier end) as is_2sd_outlier_active_upb,
    max(case when metric_name = 'delinq_30plus_upb' then zscore_12m end) as zscore_delinq_30plus_upb,
    bool_or(case when metric_name = 'delinq_30plus_upb' then is_2sd_outlier end) as is_2sd_outlier_delinq_30plus_upb,

    -- robust z + percentile (for dashboards)
    max(case when metric_name = 'active_loan_count' then robust_zscore_12m end) as robust_zscore_active_loan_count,
    max(case when metric_name = 'delinq_30plus_loan_count' then robust_zscore_12m end) as robust_zscore_delinq_30plus_loan_count,
    max(case when metric_name = 'delinquency_rate_30_plus' then robust_zscore_12m end) as robust_zscore_delinquency_rate_30_plus,
    max(case when metric_name = 'active_upb' then robust_zscore_12m end) as robust_zscore_active_upb,
    max(case when metric_name = 'delinq_30plus_upb' then robust_zscore_12m end) as robust_zscore_delinq_30plus_upb,
    max(case when metric_name = 'delinquency_upb_rate_30_plus' then robust_zscore_12m end) as robust_zscore_delinquency_upb_rate_30_plus,

    max(case when metric_name = 'active_loan_count' then percentile_rank_12m end) as percentile_rank_12m_active_loan_count,
    max(case when metric_name = 'delinq_30plus_loan_count' then percentile_rank_12m end) as percentile_rank_12m_delinq_30plus_loan_count,
    max(case when metric_name = 'delinquency_rate_30_plus' then percentile_rank_12m end) as percentile_rank_12m_delinquency_rate_30_plus,
    max(case when metric_name = 'active_upb' then percentile_rank_12m end) as percentile_rank_12m_active_upb,
    max(case when metric_name = 'delinq_30plus_upb' then percentile_rank_12m end) as percentile_rank_12m_delinq_30plus_upb,
    max(case when metric_name = 'delinquency_upb_rate_30_plus' then percentile_rank_12m end) as percentile_rank_12m_delinquency_upb_rate_30_plus,

    -- unified primary score + routing (per metric)
    max(case when metric_name = 'active_loan_count' then primary_anomaly_score end) as primary_anomaly_score_active_loan_count,
    max(case when metric_name = 'delinq_30plus_loan_count' then primary_anomaly_score end) as primary_anomaly_score_delinq_30plus_loan_count,
    max(case when metric_name = 'delinquency_rate_30_plus' then primary_anomaly_score end) as primary_anomaly_score_delinquency_rate_30_plus,
    max(case when metric_name = 'active_upb' then primary_anomaly_score end) as primary_anomaly_score_active_upb,
    max(case when metric_name = 'delinq_30plus_upb' then primary_anomaly_score end) as primary_anomaly_score_delinq_30plus_upb,
    max(case when metric_name = 'delinquency_upb_rate_30_plus' then primary_anomaly_score end) as primary_anomaly_score_delinquency_upb_rate_30_plus,

    max(case when metric_name = 'active_loan_count' then recommended_method end) as recommended_method_active_loan_count,
    max(case when metric_name = 'delinq_30plus_loan_count' then recommended_method end) as recommended_method_delinq_30plus_loan_count,
    max(case when metric_name = 'delinquency_rate_30_plus' then recommended_method end) as recommended_method_delinquency_rate_30_plus,
    max(case when metric_name = 'active_upb' then recommended_method end) as recommended_method_active_upb,
    max(case when metric_name = 'delinq_30plus_upb' then recommended_method end) as recommended_method_delinq_30plus_upb,
    max(case when metric_name = 'delinquency_upb_rate_30_plus' then recommended_method end) as recommended_method_delinquency_upb_rate_30_plus,

    max(case when metric_name = 'active_loan_count' then distribution_profile end) as distribution_profile_active_loan_count,
    max(case when metric_name = 'delinq_30plus_loan_count' then distribution_profile end) as distribution_profile_delinq_30plus_loan_count,
    max(case when metric_name = 'delinquency_rate_30_plus' then distribution_profile end) as distribution_profile_delinquency_rate_30_plus,
    max(case when metric_name = 'active_upb' then distribution_profile end) as distribution_profile_active_upb,
    max(case when metric_name = 'delinq_30plus_upb' then distribution_profile end) as distribution_profile_delinq_30plus_upb,
    max(case when metric_name = 'delinquency_upb_rate_30_plus' then distribution_profile end) as distribution_profile_delinquency_upb_rate_30_plus,

    bool_or(case when metric_name = 'active_loan_count' then is_primary_outlier end) as is_primary_outlier_active_loan_count,
    bool_or(case when metric_name = 'delinq_30plus_loan_count' then is_primary_outlier end) as is_primary_outlier_delinq_30plus_loan_count,
    bool_or(case when metric_name = 'delinquency_rate_30_plus' then is_primary_outlier end) as is_primary_outlier_delinquency_rate_30_plus,
    bool_or(case when metric_name = 'active_upb' then is_primary_outlier end) as is_primary_outlier_active_upb,
    bool_or(case when metric_name = 'delinq_30plus_upb' then is_primary_outlier end) as is_primary_outlier_delinq_30plus_upb,
    bool_or(case when metric_name = 'delinquency_upb_rate_30_plus' then is_primary_outlier end) as is_primary_outlier_delinquency_upb_rate_30_plus
from long
group by 1