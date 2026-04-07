import { compact, monthLabel, num, pct, reportingMonthKey } from "../lib/fmt";
import { formatDistributionProfile, formatMethodName } from "../lib/labels";
import { VIZ_COPY } from "../lib/vizCopy";
import { VizInfo } from "./VizInfo";

type Row = Record<string, unknown>;

export function DashboardOverview({ wide, selectedMonth }: { wide: Row[]; selectedMonth: string }) {
  const row =
    wide.find((r) => reportingMonthKey(r.reporting_month) === reportingMonthKey(selectedMonth)) ??
    wide[wide.length - 1] ??
    null;
  if (!row) return <p className="muted">No KPI wide rows.</p>;

  const m = monthLabel(reportingMonthKey(row.reporting_month));

  const dr = Number(row.delinquency_rate_30_plus);
  const wlo = Number(row.wilson_95_lo_delinquency_rate_30_plus);
  const whi = Number(row.wilson_95_hi_delinquency_rate_30_plus);
  const primary = row.primary_anomaly_score_delinquency_rate_30_plus;
  const method = String(row.recommended_method_delinquency_rate_30_plus ?? "—");
  const dist = String(row.distribution_profile_delinquency_rate_30_plus ?? "—");
  const flag = Boolean(row.is_primary_outlier_delinquency_rate_30_plus);

  return (
    <section id="overview">
      <h2 className="section-title">
        Executive overview <VizInfo text={VIZ_COPY.overview} />
        <span className="month-pill">{m}</span>
      </h2>
      <p className="section-desc">
        Portfolio health for <strong>{m}</strong>: Wilson 95% on the <em>loan-count</em> 30+ delinquency rate, and the
        primary anomaly signal for delinquency.
      </p>

      <div className="grid-cards">
        <div className="card">
          <div className="card-label">Active loans</div>
          <div className="card-value">{compact(row.active_loan_count)}</div>
          <div className="card-foot">MoM Δ {num(row.mom_delta_active_loan_count, 2)}</div>
        </div>
        <div className="card">
          <div className="card-label">30+ DQ rate (loans)</div>
          <div className="card-value">{pct(dr, 2)}</div>
          <div className="card-foot">
            Wilson 95%: {pct(wlo, 2)} – {pct(whi, 2)}
          </div>
        </div>
        <div className="card">
          <div className="card-label">Active Unpaid Principal Balance (UPB)</div>
          <div className="card-value">${compact(row.active_upb)}</div>
          <div className="card-foot">MoM Δ ${compact(row.mom_delta_active_upb)}</div>
        </div>
        <div className="card">
          <div className="card-label">Primary anomaly (DQ rate)</div>
          <div className="card-value">{primary === null || primary === undefined ? "—" : num(primary, 2)}</div>
          <div className="card-foot">
            <span className={`pill ${flag ? "bad" : "ok"}`}>{flag ? "Outlier" : "Within band"}</span>
          </div>
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-label">Routing (DQ rate)</div>
          <div style={{ fontSize: "1.05rem", fontWeight: 600 }}>{method !== "—" ? formatMethodName(method) : "—"}</div>
          <p className="muted" style={{ margin: "0.5rem 0 0", fontSize: "0.9rem" }}>
            Distribution: {formatDistributionProfile(dist)}. The chosen method feeds the primary anomaly score for the DQ
            rate.
          </p>
        </div>
        <div className="card">
          <div className="card-label">Historical context</div>
          <p className="muted" style={{ margin: 0, fontSize: "0.9rem" }}>
            Trend bands and anomaly comparisons use trailing windows so this month is compared to recent history, not
            evaluated in isolation.
          </p>
        </div>
      </div>
    </section>
  );
}
