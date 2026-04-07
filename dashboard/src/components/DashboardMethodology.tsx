import { METHODOLOGY_PARAS, VIZ_COPY } from "../lib/vizCopy";

export function DashboardMethodology() {
  return (
    <section id="method">
      <h2 className="section-title">How to read this dashboard</h2>
      <div className="card" style={{ maxWidth: "900px" }}>
        <p style={{ marginTop: 0 }}>{METHODOLOGY_PARAS.dataPath}</p>
        <ul className="muted" style={{ paddingLeft: "1.2rem" }}>
          <li>{METHODOLOGY_PARAS.wilson}</li>
          <li>{METHODOLOGY_PARAS.upb}</li>
          <li>{METHODOLOGY_PARAS.anomaly}</li>
          <li>{METHODOLOGY_PARAS.rollVintage}</li>
        </ul>
        <p className="muted" style={{ margin: "1rem 0 0.75rem", fontSize: "0.9rem" }}>
          <strong>Section tooltips (ⓘ):</strong> Each chart block repeats the same definitions in short form—hover the ⓘ
          next to a title for the full wording (overview, trends, anomaly table, roll matrix, bucket mix, vintage).
        </p>
        <details className="muted" style={{ fontSize: "0.88rem" }}>
          <summary style={{ cursor: "pointer", color: "var(--text)" }}>Expand: full copy used in ⓘ hovers</summary>
          <ul style={{ paddingLeft: "1.2rem", marginTop: "0.5rem" }}>
            <li>{VIZ_COPY.overview}</li>
            <li>{VIZ_COPY.trendsPrimary}</li>
            <li>{VIZ_COPY.trendsMom}</li>
            <li>{VIZ_COPY.trendsAnomaly}</li>
            <li>{VIZ_COPY.trendsUpb}</li>
            <li>{VIZ_COPY.anomalies}</li>
            <li>{VIZ_COPY.roll}</li>
            <li>{VIZ_COPY.buckets}</li>
            <li>{VIZ_COPY.vintage}</li>
          </ul>
        </details>
      </div>
    </section>
  );
}
