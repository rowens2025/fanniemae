import { num } from "../lib/fmt";
import { formatDistributionProfile, formatMetricName, formatMethodName } from "../lib/labels";
import { VIZ_COPY } from "../lib/vizCopy";
import { VizInfo } from "./VizInfo";

type Row = Record<string, unknown>;

export function DashboardAnomalies({ rows, month }: { rows: Row[]; month: string }) {
  const methodHint = (profile: string) => {
    const p = profile.toLowerCase();
    if (p.includes("near") || p.includes("normal")) return "Near-normal profile: classic z-score is preferred for symmetric distributions.";
    if (p.includes("moderate") || p.includes("skew")) return "Moderate skew/tails: robust z-score reduces sensitivity to outliers.";
    if (p.includes("heavy") || p.includes("bounded") || p.includes("extreme")) {
      return "Heavy-tail or bounded profile: percentile rank fits non-Gaussian behavior.";
    }
    return "Routing picks the most stable detector based on distribution shape metrics.";
  };

  return (
    <section id="anomalies">
      <h2 className="section-title">
        Anomaly routing <VizInfo text={VIZ_COPY.anomalies} />
        <span className="month-pill">{month}</span>
      </h2>
      <p className="section-desc">
        Month <strong>{month}</strong>. Each KPI uses trailing-12-month shape to prefer classic z-score, robust
        z-score, or percentile rank; the primary score column is the unified review field.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              <th>Value</th>
              <th>Profile</th>
              <th>Recommended</th>
              <th>Classic z</th>
              <th>Robust z</th>
              <th>Pct rank</th>
              <th>Primary</th>
              <th>Outlier?</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const rawMetric = String(r.metric_name);
              return (
                <tr key={rawMetric}>
                  <td>{formatMetricName(rawMetric)}</td>
                  <td>{r.metric_value === null || r.metric_value === undefined ? "—" : num(r.metric_value, 2)}</td>
                  <td>{formatDistributionProfile(String(r.distribution_profile ?? "—"))}</td>
                  <td>
                    <span title={methodHint(String(r.distribution_profile ?? "unknown"))}>
                      {r.recommended_method != null && String(r.recommended_method) !== ""
                        ? formatMethodName(String(r.recommended_method))
                        : "—"}
                    </span>
                  </td>
                  <td>{r.zscore_12m === null || r.zscore_12m === undefined ? "—" : num(r.zscore_12m, 2)}</td>
                  <td>{r.robust_zscore_12m === null || r.robust_zscore_12m === undefined ? "—" : num(r.robust_zscore_12m, 2)}</td>
                  <td>
                    {r.percentile_rank_12m === null || r.percentile_rank_12m === undefined
                      ? "—"
                      : num(r.percentile_rank_12m, 2)}
                  </td>
                  <td>
                    {r.primary_anomaly_score === null || r.primary_anomaly_score === undefined
                      ? "—"
                      : num(r.primary_anomaly_score, 2)}
                  </td>
                  <td>{r.is_primary_outlier === true ? "yes" : r.is_primary_outlier === false ? "no" : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
