{{ config(materialized='view') }}

with base as (
    select
        reporting_month,
        sum(case when delinquency_bucket != 'zero_balance' then distinct_loan_count else 0 end) as active_loan_count,
        sum(case when delinquency_bucket in ('30_days', '60_days', '90_plus', 'reo') then distinct_loan_count else 0 end)
            as delinq_30plus_loan_count,
        sum(case when delinquency_bucket != 'zero_balance' then total_current_actual_upb else 0 end) as active_upb,
        sum(case when delinquency_bucket in ('30_days', '60_days', '90_plus', 'reo') then total_current_actual_upb else 0 end)
            as delinq_30plus_upb
    from {{ ref('fct_portfolio_monthly') }}
    group by 1
),
metrics as (
    select
        reporting_month,
        'active_loan_count'::text as metric_name,
        active_loan_count::numeric as metric_value
    from base

    union all

    select
        reporting_month,
        'delinq_30plus_loan_count'::text as metric_name,
        delinq_30plus_loan_count::numeric as metric_value
    from base

    union all

    select
        reporting_month,
        'delinquency_rate_30_plus'::text as metric_name,
        case when active_loan_count = 0 then null
             else delinq_30plus_loan_count::numeric / active_loan_count::numeric
        end as metric_value
    from base

    union all

    select
        reporting_month,
        'active_upb'::text as metric_name,
        active_upb::numeric as metric_value
    from base

    union all

    select
        reporting_month,
        'delinq_30plus_upb'::text as metric_name,
        delinq_30plus_upb::numeric as metric_value
    from base

    union all

    select
        reporting_month,
        'delinquency_upb_rate_30_plus'::text as metric_name,
        case when active_upb = 0 then null
             else delinq_30plus_upb::numeric / active_upb::numeric
        end as metric_value
    from base
),
windowed as (
    select
        *,
        row_number() over (
            partition by metric_name
            order by reporting_month
        ) as rn,
        lag(metric_value, 1) over (partition by metric_name order by reporting_month) as prior_month_metric_value,
        lag(metric_value, 12) over (partition by metric_name order by reporting_month) as prior_year_metric_value,
        avg(metric_value) over (
            partition by metric_name
            order by reporting_month
            rows between 11 preceding and current row
        ) as trailing_12m_avg,
        stddev_samp(metric_value) over (
            partition by metric_name
            order by reporting_month
            rows between 11 preceding and current row
        ) as trailing_12m_stddev
    from metrics
),
with_window_stats as (
    select
        w.*,
        (
            select percentile_cont(0.5) within group (order by m2.metric_value)
            from metrics m2
            where m2.metric_name = w.metric_name
              and m2.reporting_month >= w.reporting_month - interval '11 months'
              and m2.reporting_month <= w.reporting_month
        ) as rolling_median_12m,
        (
            select percentile_cont(0.5) within group (order by abs(m2.metric_value - (
                select percentile_cont(0.5) within group (order by m3.metric_value)
                from metrics m3
                where m3.metric_name = w.metric_name
                  and m3.reporting_month >= w.reporting_month - interval '11 months'
                  and m3.reporting_month <= w.reporting_month
            )))
            from metrics m2
            where m2.metric_name = w.metric_name
              and m2.reporting_month >= w.reporting_month - interval '11 months'
              and m2.reporting_month <= w.reporting_month
        ) as rolling_mad_12m,
        (
            with win as (
                select m2.metric_value as v
                from metrics m2
                where m2.metric_name = w.metric_name
                  and m2.reporting_month >= w.reporting_month - interval '11 months'
                  and m2.reporting_month <= w.reporting_month
            )
            select
                case
                    when (select count(*) from win) < 3 then null
                    when (select stddev_samp(v) from win) is null or (select stddev_samp(v) from win) = 0 then null
                    else (
                        select
                            sum(power(v - (select avg(v) from win), 3)) / count(*)::numeric
                            / nullif(power((select stddev_samp(v) from win), 3), 0)
                        from win
                    )
                end
        ) as trailing_12m_skewness,
        (
            with win as (
                select m2.metric_value as v
                from metrics m2
                where m2.metric_name = w.metric_name
                  and m2.reporting_month >= w.reporting_month - interval '11 months'
                  and m2.reporting_month <= w.reporting_month
            )
            select
                case
                    when (select count(*) from win) < 4 then null
                    when (select stddev_samp(v) from win) is null or (select stddev_samp(v) from win) = 0 then null
                    else (
                        select
                            sum(power(v - (select avg(v) from win), 4)) / count(*)::numeric
                            / nullif(power((select stddev_samp(v) from win), 4), 0)
                            - 3.0
                        from win
                    )
                end
        ) as trailing_12m_excess_kurtosis,
        (
            select
                case
                    when count(*) = 0 then null
                    else 100.0 * (
                        count(*) filter (where m2.metric_value < w.metric_value)::numeric
                        + 0.5 * count(*) filter (where m2.metric_value = w.metric_value)::numeric
                    ) / nullif(count(*)::numeric, 0)
                end
            from metrics m2
            where m2.metric_name = w.metric_name
              and m2.reporting_month >= w.reporting_month - interval '11 months'
              and m2.reporting_month <= w.reporting_month
        ) as percentile_rank_12m
    from windowed w
),
scored as (
    select
        reporting_month,
        metric_name,
        metric_value,
        rn,
        prior_month_metric_value,
        prior_year_metric_value,
        trailing_12m_avg,
        trailing_12m_stddev,
        rolling_median_12m,
        rolling_mad_12m,
        trailing_12m_skewness,
        trailing_12m_excess_kurtosis,
        percentile_rank_12m,
        metric_value - prior_month_metric_value as mom_delta,
        (metric_value - prior_month_metric_value)
            / nullif(prior_month_metric_value, 0) as mom_pct_change,
        metric_value - prior_year_metric_value as yoy_delta,
        (metric_value - prior_year_metric_value)
            / nullif(prior_year_metric_value, 0) as yoy_pct_change,
        case
            when trailing_12m_stddev is null or trailing_12m_stddev = 0 then null
            else (metric_value - trailing_12m_avg) / trailing_12m_stddev
        end as zscore_12m,
        case
            when trailing_12m_stddev is null or trailing_12m_stddev = 0 then null
            when abs((metric_value - trailing_12m_avg) / trailing_12m_stddev) >= 2 then true
            else false
        end as is_2sd_outlier,
        case
            when rolling_mad_12m is null or rolling_mad_12m = 0 then null
            else 0.6745 * (metric_value - rolling_median_12m) / rolling_mad_12m
        end as robust_zscore_12m,
        case
            when rolling_mad_12m is null or rolling_mad_12m = 0 then null
            when abs(0.6745 * (metric_value - rolling_median_12m) / rolling_mad_12m) >= 2 then true
            else false
        end as is_2sd_outlier_robust,
        case
            when rn < 12 or metric_value is null then 'insufficient_history'
            when trailing_12m_stddev is null or trailing_12m_stddev = 0 then 'degenerate_window'
            when trailing_12m_skewness is not null
                and abs(trailing_12m_skewness) < 0.5
                and trailing_12m_excess_kurtosis is not null
                and trailing_12m_excess_kurtosis between -1.0 and 1.0
                then 'normal_like'
            when trailing_12m_skewness is not null
                and abs(trailing_12m_skewness) < 1.5
                then 'moderate_skew'
            else 'heavy_tailed_or_unknown'
        end as distribution_profile,
        case
            when rn < 12 or metric_value is null then null
            when trailing_12m_stddev is null or trailing_12m_stddev = 0 then 'percentile_rank'
            when trailing_12m_skewness is not null
                and abs(trailing_12m_skewness) < 0.5
                and trailing_12m_excess_kurtosis is not null
                and trailing_12m_excess_kurtosis between -1.0 and 1.0
                then 'classic_z'
            when trailing_12m_skewness is not null
                and abs(trailing_12m_skewness) < 1.5
                then 'robust_z'
            else 'percentile_rank'
        end as recommended_method,
        case
            when rn < 12 or metric_value is null then null
            when trailing_12m_stddev is null or trailing_12m_stddev = 0 then null
            when trailing_12m_skewness is not null
                and abs(trailing_12m_skewness) < 0.5
                and trailing_12m_excess_kurtosis is not null
                and trailing_12m_excess_kurtosis between -1.0 and 1.0
                then (metric_value - trailing_12m_avg) / trailing_12m_stddev
            when trailing_12m_skewness is not null
                and abs(trailing_12m_skewness) < 1.5
                then case
                    when rolling_mad_12m is null or rolling_mad_12m = 0 then null
                    else 0.6745 * (metric_value - rolling_median_12m) / rolling_mad_12m
                end
            else (percentile_rank_12m - 50.0) / 50.0 * 3.0
        end as primary_anomaly_score,
        case
            when rn < 12 or metric_value is null then null
            when trailing_12m_stddev is null or trailing_12m_stddev = 0 then (
                percentile_rank_12m <= 10.0 or percentile_rank_12m >= 90.0
            )
            when trailing_12m_skewness is not null
                and abs(trailing_12m_skewness) < 0.5
                and trailing_12m_excess_kurtosis is not null
                and trailing_12m_excess_kurtosis between -1.0 and 1.0
                then abs((metric_value - trailing_12m_avg) / nullif(trailing_12m_stddev, 0)) >= 2
            when trailing_12m_skewness is not null
                and abs(trailing_12m_skewness) < 1.5
                then case
                    when rolling_mad_12m is null or rolling_mad_12m = 0 then null
                    else abs(0.6745 * (metric_value - rolling_median_12m) / rolling_mad_12m) >= 2
                end
            else percentile_rank_12m <= 10.0 or percentile_rank_12m >= 90.0
        end as is_primary_outlier
    from with_window_stats
),
final as (
    select
        s.*,
        b.delinq_30plus_loan_count as binomial_x_delinq_loans,
        b.active_loan_count as binomial_n_active_loans,
        b.delinq_30plus_upb,
        b.active_upb,
        case
            when s.metric_name = 'delinquency_rate_30_plus'
                and b.active_loan_count is not null
                and b.active_loan_count > 0
            then b.delinq_30plus_loan_count::numeric / b.active_loan_count::numeric
        end as binomial_p_hat,
        case
            when s.metric_name = 'delinquency_rate_30_plus'
                and b.active_loan_count is not null
                and b.active_loan_count > 0
            then (
                select
                    (
                        (t.p + (t.z * t.z) / (2.0 * t.n))
                        - t.z * sqrt(((t.p * (1.0 - t.p) + (t.z * t.z) / (4.0 * t.n)) / t.n))
                    ) / (1.0 + (t.z * t.z) / t.n)
                from (
                    select
                        b.delinq_30plus_loan_count::numeric / b.active_loan_count::numeric as p,
                        b.active_loan_count::numeric as n,
                        1.96::numeric as z
                ) t
            )
        end as wilson_95_lo,
        case
            when s.metric_name = 'delinquency_rate_30_plus'
                and b.active_loan_count is not null
                and b.active_loan_count > 0
            then (
                select
                    (
                        (t.p + (t.z * t.z) / (2.0 * t.n))
                        + t.z * sqrt(((t.p * (1.0 - t.p) + (t.z * t.z) / (4.0 * t.n)) / t.n))
                    ) / (1.0 + (t.z * t.z) / t.n)
                from (
                    select
                        b.delinq_30plus_loan_count::numeric / b.active_loan_count::numeric as p,
                        b.active_loan_count::numeric as n,
                        1.96::numeric as z
                ) t
            )
        end as wilson_95_hi,
        case
            when s.metric_name = 'delinquency_upb_rate_30_plus'
                and b.active_upb is not null
                and b.active_upb > 0
                and b.active_loan_count is not null
                and b.active_loan_count > 0
            then (
                select greatest(
                    t.p - t.z * sqrt(t.p * (1.0 - t.p) / nullif(t.n_eff, 0)),
                    0.0
                )
                from (
                    select
                        b.delinq_30plus_upb::numeric / b.active_upb::numeric as p,
                        b.active_loan_count::numeric as n_eff,
                        1.96::numeric as z
                ) t
            )
        end as upb_rate_normal_approx_95_lo,
        case
            when s.metric_name = 'delinquency_upb_rate_30_plus'
                and b.active_upb is not null
                and b.active_upb > 0
                and b.active_loan_count is not null
                and b.active_loan_count > 0
            then (
                select least(
                    t.p + t.z * sqrt(t.p * (1.0 - t.p) / nullif(t.n_eff, 0)),
                    1.0
                )
                from (
                    select
                        b.delinq_30plus_upb::numeric / b.active_upb::numeric as p,
                        b.active_loan_count::numeric as n_eff,
                        1.96::numeric as z
                ) t
            )
        end as upb_rate_normal_approx_95_hi
    from scored s
    left join base b on b.reporting_month = s.reporting_month
)
select * from final
