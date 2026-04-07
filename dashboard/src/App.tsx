import { useEffect, useMemo, useState } from "react";
import { DashboardAnomalies } from "./components/DashboardAnomalies";
import { DashboardBuckets } from "./components/DashboardBuckets";
import { DashboardMethodology } from "./components/DashboardMethodology";
import { DashboardOverview } from "./components/DashboardOverview";
import { DashboardTrends } from "./components/DashboardTrends";
import { DashboardVintage } from "./components/DashboardVintage";
import { useDashboardData } from "./hooks/useDashboardData";
import { DashboardRollMatrix } from "./components/DashboardRollMatrix";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { monthLabel, reportingMonthKey } from "./lib/fmt";

const NAV: { id: string; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "trends", label: "Trends & Bands" },
  { id: "anomalies", label: "Anomaly matrix" },
  { id: "roll", label: "Roll rate" },
  { id: "vintage", label: "Vintage" },
  { id: "buckets", label: "Bucket mix" },
  { id: "method", label: "Methodology" },
];

export default function App() {
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const { kpiWide, buckets, roll, vintage, kpiLong } = useDashboardData(selectedMonth || undefined);
  const [active, setActive] = useState("overview");

  const wideRows = useMemo(() => {
    if (kpiWide.status !== "ok") return [];
    return kpiWide.data.rows ?? [];
  }, [kpiWide]);

  const longRows = useMemo(() => {
    if (kpiLong.status !== "ok") return [];
    return kpiLong.data.rows ?? [];
  }, [kpiLong]);

  const bucketRows = useMemo(() => {
    if (buckets.status !== "ok") return [];
    return buckets.data.rows ?? [];
  }, [buckets]);

  const rollRows = useMemo(() => {
    if (roll.status !== "ok") return [];
    return roll.data.rows ?? [];
  }, [roll]);

  const vintageRows = useMemo(() => {
    if (vintage.status !== "ok") return [];
    return vintage.data.rows ?? [];
  }, [vintage]);

  const months = useMemo(() => {
    const m = wideRows
      .map((r) => reportingMonthKey(r.reporting_month))
      .filter((x) => x.length > 0);
    const out: string[] = [];
    const seen = new Set<string>();
    for (const x of m) {
      if (seen.has(x)) continue;
      seen.add(x);
      out.push(x);
    }
    return out;
  }, [wideRows]);

  useEffect(() => {
    if (!months.length) return;
    setSelectedMonth((prev) => (prev && months.includes(prev) ? prev : months[months.length - 1]!));
  }, [months]);

  const loading =
    kpiWide.status === "loading" ||
    buckets.status === "loading" ||
    roll.status === "loading" ||
    vintage.status === "loading" ||
    kpiLong.status === "loading";

  const err =
    kpiWide.status === "err"
      ? kpiWide.message
      : buckets.status === "err"
        ? buckets.message
        : roll.status === "err"
          ? roll.message
          : vintage.status === "err"
            ? vintage.message
            : kpiLong.status === "err"
              ? kpiLong.message
              : null;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">Mortgage analytics</div>
        <div className="brand-sub">
          Fannie Mae loan-level · Neon marts · dbt-built facts & KPIs
        </div>
        {NAV.map((n) => (
          <button
            key={n.id}
            type="button"
            className={`nav-btn ${active === n.id ? "active" : ""}`}
            onClick={() => {
              setActive(n.id);
              document.getElementById(n.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            {n.label}
          </button>
        ))}
      </aside>
      <main className="main">
        <header className="page-head">
          <div>
            <h1 className="page-title">Portfolio intelligence</h1>
          </div>
          <div className="commandbar">
            <div className="command-item">
              <div className="command-label">Reporting month</div>
              <select
                className="command-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                disabled={!months.length}
              >
                {months.map((m) => (
                  <option key={m} value={m}>
                    {monthLabel(m)}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="btn"
              onClick={() => setSelectedMonth(months[months.length - 1] ?? "")}
              disabled={!months.length}
              title="Jump to most recent month"
            >
              Latest
            </button>
          </div>
        </header>

        {loading && <div className="loading">Loading marts from Neon…</div>}
        {err && <div className="error-banner">API error: {err}</div>}

        {!loading && !err && (
          <ErrorBoundary>
            <DashboardOverview wide={wideRows} selectedMonth={selectedMonth} />
            <DashboardTrends wide={wideRows} selectedMonth={selectedMonth} onSelectMonth={setSelectedMonth} />
            <DashboardAnomalies rows={longRows} month={monthLabel(selectedMonth)} />
            <DashboardRollMatrix rows={rollRows} selectedMonth={selectedMonth} />
            <DashboardVintage rows={vintageRows} />
            <DashboardBuckets rows={bucketRows} selectedMonth={selectedMonth} onSelectMonth={setSelectedMonth} />
            <DashboardMethodology />
          </ErrorBoundary>
        )}
      </main>
    </div>
  );
}
