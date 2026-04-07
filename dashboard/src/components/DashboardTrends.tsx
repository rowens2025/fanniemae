import { useMemo, useState } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { compact, monthLabel, num, pct, pp, reportingMonthKey } from "../lib/fmt";
import { VIZ_COPY } from "../lib/vizCopy";
import { VizInfo } from "./VizInfo";

type Row = Record<string, unknown>;

type MetricId = "dq_rate" | "active_loans" | "active_upb" | "primary_anomaly";

const METRIC_OPTIONS: { id: MetricId; label: string }[] = [
  { id: "dq_rate", label: "30+ Delinquency rate (loans)" },
  { id: "active_loans", label: "Active loans" },
  { id: "active_upb", label: "Active Unpaid Principal Balance (UPB)" },
  { id: "primary_anomaly", label: "Primary anomaly (DQ rate)" },
];

function quantile(sorted: number[], q: number): number {
  if (!sorted.length) return 0;
  const i = (sorted.length - 1) * q;
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  if (lo === hi) return sorted[lo]!;
  return sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (i - lo);
}

function calcHistoricalBand(values: number[], idx: number, lookback = 24): { lo: number | null; hi: number | null } {
  const start = Math.max(0, idx - lookback);
  const baseline = values.slice(start, idx).filter((v) => Number.isFinite(v));
  if (baseline.length < 6) return { lo: null, hi: null };
  const sorted = [...baseline].sort((a, b) => a - b);
  return { lo: quantile(sorted, 0.1), hi: quantile(sorted, 0.9) };
}

export function DashboardTrends({
  wide,
  selectedMonth,
  onSelectMonth,
}: {
  wide: Row[];
  selectedMonth: string;
  onSelectMonth: (m: string) => void;
}) {
  const [secondaryMetric, setSecondaryMetric] = useState<MetricId | "">("");
  const [bandMode, setBandMode] = useState<"historical24" | "wilson">("historical24");

  const data = useMemo(() => {
    const base = wide.map((r) => ({
      reportingMonth: reportingMonthKey(r.reporting_month),
      m: monthLabel(reportingMonthKey(r.reporting_month)),
      dq_rate: Number(r.delinquency_rate_30_plus),
      active_loans: Number(r.active_loan_count),
      active_upb: Number(r.active_upb),
      primary_anomaly: Number(r.primary_anomaly_score_delinquency_rate_30_plus),
      wilson_lo: Number(r.wilson_95_lo_delinquency_rate_30_plus),
      wilson_hi: Number(r.wilson_95_hi_delinquency_rate_30_plus),
      dur: Number(r.delinquency_upb_rate_30_plus),
    }));
    const dq = base.map((d) => d.dq_rate);
    const anomalyVals = base.map((d) => d.dq_rate);
    return base.map((d, i) => {
      const hist = calcHistoricalBand(dq, i, 24);
      const histAnom = calcHistoricalBand(anomalyVals, i, 24);
      const mid = histAnom.lo === null || histAnom.hi === null ? null : (histAnom.lo + histAnom.hi) / 2;
      const span = histAnom.lo === null || histAnom.hi === null ? null : (histAnom.hi - histAnom.lo) / 2;
      const z24 = mid === null || span === null || span === 0 ? null : (d.dq_rate - mid) / span;
      const prev = i > 0 ? base[i - 1] : null;
      const yoy = i >= 12 ? base[i - 12] : null;
      const mom_pp =
        prev != null && Number.isFinite(prev.dq_rate) && Number.isFinite(d.dq_rate) ? d.dq_rate - prev.dq_rate : null;
      const yoy_pp =
        yoy != null && Number.isFinite(yoy.dq_rate) && Number.isFinite(d.dq_rate) ? d.dq_rate - yoy.dq_rate : null;
      return {
        ...d,
        hist_lo: hist.lo,
        hist_hi: hist.hi,
        z24,
        mom_pp,
        yoy_pp,
      };
    });
  }, [wide]);

  const selectedMonthLabel = selectedMonth ? monthLabel(selectedMonth) : "";
  const monthDisp = selectedMonthLabel || "—";

  const metricFormatter = (metric: MetricId, v: number): string => {
    if (metric === "dq_rate") return pct(v, 2);
    if (metric === "active_upb") return `$${compact(v)}`;
    if (metric === "active_loans") return num(v, 2);
    return num(v, 2);
  };

  const tooltipMain = (val: unknown, name: string) => {
    const n = Number(val);
    const label =
      name.includes("rate") || name.includes("band") || name.includes("Wilson") || name.includes("DQ")
        ? pct(n, 2)
        : num(n, 2);
    return [label, name];
  };

  return (
    <section id="trends">
      <h2 className="section-title">
        Trends & historical comparison
        <span className="month-pill">{monthDisp}</span>
      </h2>
      <p className="section-desc">
        Reporting month <strong>{monthDisp}</strong> (header selector). Primary chart compares 30+ DQ rate to a
        trailing-24-month historical envelope or Wilson bands. Click any point to sync the rest of the dashboard.
      </p>

      <div className="chart-wrap">
        <div className="chart-head">
          <div className="chart-title-row" style={{ marginBottom: 0 }}>
            <span>30+ delinquency rate + comparison band</span>
            <VizInfo text={VIZ_COPY.trendsPrimary} label="About the primary trend chart" />
          </div>
          <div className="segmented">
            <button
              type="button"
              className={`seg-btn ${bandMode === "historical24" ? "active" : ""}`}
              onClick={() => setBandMode("historical24")}
            >
              Historical (24m)
            </button>
            <button
              type="button"
              className={`seg-btn ${bandMode === "wilson" ? "active" : ""}`}
              onClick={() => setBandMode("wilson")}
            >
              Wilson
            </button>
            <select
              className="command-select"
              value={secondaryMetric}
              onChange={(e) => setSecondaryMetric(e.target.value as MetricId | "")}
              style={{ minWidth: 250 }}
            >
              <option value="">Select secondary metric</option>
              {METRIC_OPTIONS.filter((o) => o.id !== "dq_rate").map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ width: "100%", height: 360 }}>
          <ResponsiveContainer>
            <ComposedChart
              data={data}
              margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
              onClick={(s) => {
                const p = (s as unknown as { activePayload?: Array<{ payload?: { reportingMonth?: string } }> })
                  .activePayload?.[0]?.payload?.reportingMonth;
                if (p) onSelectMonth(p);
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#243044" />
              <XAxis dataKey="m" tick={{ fill: "#8b9bb0", fontSize: 11 }} />
              <YAxis
                yAxisId="left"
                tick={{ fill: "#8b9bb0", fontSize: 11 }}
                tickFormatter={(v) => pct(v, 2)}
                domain={["auto", "auto"]}
              />
              {secondaryMetric && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: "#8b9bb0", fontSize: 11 }}
                  tickFormatter={(v) => metricFormatter(secondaryMetric, Number(v))}
                  domain={["auto", "auto"]}
                />
              )}
              <Tooltip contentStyle={{ background: "#121922", border: "1px solid #243044" }} formatter={tooltipMain} />
              <Legend />
              {bandMode === "historical24" ? (
                <>
                  <Line yAxisId="left" type="monotone" dataKey="hist_lo" stroke="#5c6f86" strokeWidth={1} strokeDasharray="4 4" dot={false} name="24m low band" />
                  <Line yAxisId="left" type="monotone" dataKey="hist_hi" stroke="#5c6f86" strokeWidth={1} strokeDasharray="4 4" dot={false} name="24m high band" />
                </>
              ) : (
                <>
                  <Line yAxisId="left" type="monotone" dataKey="wilson_lo" stroke="#5c6f86" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Wilson low" />
                  <Line yAxisId="left" type="monotone" dataKey="wilson_hi" stroke="#5c6f86" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Wilson high" />
                </>
              )}
              <Line yAxisId="left" type="monotone" dataKey="dq_rate" stroke="#3dd6c3" strokeWidth={2} dot={false} name="DQ rate" />
              {secondaryMetric && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey={secondaryMetric}
                  stroke="#f4a261"
                  strokeWidth={2}
                  dot={false}
                  name={METRIC_OPTIONS.find((m) => m.id === secondaryMetric)?.label ?? "Secondary"}
                />
              )}
              {selectedMonthLabel && (
                <ReferenceLine x={selectedMonthLabel} yAxisId="left" stroke="#8ecae6" strokeDasharray="3 3" />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="two-col">
        <div className="chart-wrap">
          <div className="chart-title-row">
            <span>Absolute change in DQ rate (percentage points)</span>
            <VizInfo text={VIZ_COPY.trendsMom} label="About MoM / YoY change" />
          </div>
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer>
              <ComposedChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#243044" />
                <XAxis dataKey="m" tick={{ fill: "#8b9bb0", fontSize: 11 }} />
                <YAxis tick={{ fill: "#8b9bb0", fontSize: 11 }} tickFormatter={(v) => pp(v, 2)} domain={["auto", "auto"]} />
                <Tooltip
                  contentStyle={{ background: "#121922", border: "1px solid #243044" }}
                  formatter={(v: unknown, name: string) => {
                    const n = Number(v);
                    if (v == null || Number.isNaN(n)) return ["—", name];
                    return [pp(n, 2), name];
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="mom_pp" stroke="#7c6cff" strokeWidth={2} dot={false} name="MoM pp" />
                <Line type="monotone" dataKey="yoy_pp" stroke="#f4a261" strokeWidth={2} dot={false} name="YoY pp" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="chart-wrap">
          <div className="chart-title-row">
            <span>Historical anomaly score — DQ rate (trailing 24m)</span>
            <VizInfo text={VIZ_COPY.trendsAnomaly} label="About the anomaly score chart" />
          </div>
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer>
              <ComposedChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#243044" />
                <XAxis dataKey="m" tick={{ fill: "#8b9bb0", fontSize: 11 }} />
                <YAxis tick={{ fill: "#8b9bb0", fontSize: 11 }} domain={["auto", "auto"]} tickFormatter={(v) => num(v, 2)} />
                <Tooltip
                  contentStyle={{ background: "#121922", border: "1px solid #243044" }}
                  formatter={(v: number) => [num(v, 2), "Score"]}
                />
                <Legend />
                <ReferenceLine y={0} stroke="#5c6f86" strokeDasharray="3 3" />
                <ReferenceLine y={2} stroke="#7a3045" strokeDasharray="3 3" />
                <ReferenceLine y={-2} stroke="#7a3045" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="z24" stroke="#ef476f" strokeWidth={2} dot={false} name="z24 score" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="chart-wrap">
        <div className="chart-title-row">
          <span>UPB-weighted 30+ rate vs loan-count rate</span>
          <VizInfo text={VIZ_COPY.trendsUpb} label="About UPB vs loan DQ rate" />
        </div>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <ComposedChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#243044" />
              <XAxis dataKey="m" tick={{ fill: "#8b9bb0", fontSize: 11 }} />
              <YAxis tick={{ fill: "#8b9bb0", fontSize: 11 }} tickFormatter={(v) => pct(v, 2)} />
              <Tooltip
                contentStyle={{ background: "#121922", border: "1px solid #243044" }}
                formatter={(v: unknown, name: string) => [pct(Number(v), 2), name]}
              />
              <Legend />
              <Line type="monotone" dataKey="dq_rate" stroke="#3dd6c3" strokeWidth={2} dot={false} name="Loan DQ rate" />
              <Line type="monotone" dataKey="dur" stroke="#8ecae6" strokeWidth={2} dot={false} name="UPB DQ rate" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
