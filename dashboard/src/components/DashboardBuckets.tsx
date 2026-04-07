import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDelinquencyBucket } from "../lib/labels";
import { monthLabel, pct, reportingMonthKey } from "../lib/fmt";
import { VIZ_COPY } from "../lib/vizCopy";
import { VizInfo } from "./VizInfo";

type Row = Record<string, unknown>;

const ORDER = [
  "current",
  "30_days",
  "60_days",
  "90_plus",
  "reo",
  "zero_balance",
  "unknown",
  "other",
];

const COLORS: Record<string, string> = {
  current: "#3dd6c3",
  "30_days": "#8ecae6",
  "60_days": "#7c6cff",
  "90_plus": "#f4a261",
  reo: "#ef476f",
  zero_balance: "#5c6f86",
  unknown: "#9aa7b7",
  other: "#4b5563",
};

export function DashboardBuckets({
  rows,
  selectedMonth,
  onSelectMonth,
}: {
  rows: Row[];
  selectedMonth: string;
  onSelectMonth: (m: string) => void;
}) {
  const [mode, setMode] = useState<"all" | "delinq">("delinq");
  const monthDisp = selectedMonth ? monthLabel(selectedMonth) : "—";

  const chartData = useMemo(() => {
    const byMonth = new Map<string, Record<string, number>>();
    for (const r of rows) {
      const m = monthLabel(reportingMonthKey(r.reporting_month));
      const b = String(r.delinquency_bucket);
      if (!byMonth.has(m)) byMonth.set(m, {});
      const o = byMonth.get(m)!;
      o[b] = Number(r.loan_share_of_month ?? 0);
    }
    const months = [...byMonth.keys()].sort();
    return months.map((m) => {
      const o: Record<string, number | string> = { m };
      if (mode === "all") {
        for (const b of ORDER) o[b] = byMonth.get(m)?.[b] ?? 0;
      } else {
        const buckets = ORDER.filter((b) => b !== "current");
        const total = buckets.reduce((acc, b) => acc + (byMonth.get(m)?.[b] ?? 0), 0);
        for (const b of buckets) {
          const v = byMonth.get(m)?.[b] ?? 0;
          o[b] = total > 0 ? v / total : 0;
        }
      }
      return o;
    });
  }, [rows, mode]);

  const keys = mode === "all" ? ORDER : ORDER.filter((b) => b !== "current");

  return (
    <section id="buckets">
      <div className="section-head">
        <div>
          <h2 className="section-title">
            Delinquency bucket mix <VizInfo text={VIZ_COPY.buckets} />
            <span className="month-pill">{monthDisp}</span>
          </h2>
          <p className="section-desc">
            Stacked loan share by delinquency bucket (monthly portfolio mart). Reporting month{" "}
            <strong>{monthDisp}</strong> matches the header; click the chart to change it. Use Delinquent-only to focus on
            the distress mix without Current diluting the stack.
          </p>
        </div>
        <div className="segmented">
          <button type="button" className={`seg-btn ${mode === "delinq" ? "active" : ""}`} onClick={() => setMode("delinq")}>
            Delinquent-only
          </button>
          <button type="button" className={`seg-btn ${mode === "all" ? "active" : ""}`} onClick={() => setMode("all")}>
            All (incl. current)
          </button>
        </div>
      </div>
      <div className="chart-wrap">
        <div className="chart-title-row">
          <span>
            Loan share by bucket ({mode === "all" ? "full portfolio" : "delinquent-only, re-normalized"})
          </span>
        </div>
        <div style={{ width: "100%", height: 360 }}>
          <ResponsiveContainer>
            <AreaChart
              data={chartData}
              margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
              onClick={(s) => {
                const label = (s as unknown as { activeLabel?: string }).activeLabel;
                if (label) onSelectMonth(reportingMonthKey(`${label}-01`));
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#243044" />
              <XAxis dataKey="m" tick={{ fill: "#8b9bb0", fontSize: 11 }} />
              <YAxis
                tick={{ fill: "#8b9bb0", fontSize: 11 }}
                domain={[0, 1]}
                tickFormatter={(v) => pct(v, 2)}
              />
              <Tooltip
                contentStyle={{ background: "#121922", border: "1px solid #243044" }}
                formatter={(v: number, name: string) => [pct(v, 2), name]}
              />
              <Legend />
              {keys.map((b) => (
                <Area
                  key={b}
                  type="monotone"
                  dataKey={b}
                  stackId="1"
                  stroke={COLORS[b] ?? "#888"}
                  fill={COLORS[b] ?? "#888"}
                  fillOpacity={0.85}
                  name={formatDelinquencyBucket(b)}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
