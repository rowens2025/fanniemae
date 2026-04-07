import { useEffect, useMemo, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { monthLabel, pct, reportingMonthKey } from "../lib/fmt";
import { VIZ_COPY } from "../lib/vizCopy";
import { VizInfo } from "./VizInfo";

type Row = Record<string, unknown>;

function cohortSortKey(label: string): number {
  const m = /^(\d{4})Q([1-4])$/.exec(label.trim());
  if (!m) return Number.MAX_SAFE_INTEGER;
  return Number(m[1]) * 10 + Number(m[2]);
}

/** Vintage is cohort-driven only: no global reporting month, so chart clicks elsewhere do not affect this block. */
export function DashboardVintage({ rows }: { rows: Row[] }) {
  const cohorts = useMemo(() => {
    const s = new Set<string>();
    for (const r of rows) {
      s.add(`${r.vintage_year}Q${r.vintage_quarter}`);
    }
    return [...s].sort((a, b) => cohortSortKey(a) - cohortSortKey(b));
  }, [rows]);

  const [cohort, setCohort] = useState("");

  useEffect(() => {
    if (!cohorts.length) return;
    setCohort((prev) => (prev && cohorts.includes(prev) ? prev : cohorts[0]!));
  }, [cohorts]);

  const series = useMemo(() => {
    if (!cohort) return [];
    const [y, q] = cohort.split("Q");
    const vy = Number(y);
    const vq = Number(q);
    const slice = rows
      .filter((r) => Number(r.vintage_year) === vy && Number(r.vintage_quarter) === vq)
      .sort((a, b) => Number(a.vintage_month) - Number(b.vintage_month));
    return slice.map((r) => ({
      vm: Number(r.vintage_month),
      m: monthLabel(reportingMonthKey(r.reporting_month)),
      dr: Number(r.delinquency_rate_30_plus),
      dur: Number(r.delinquency_upb_rate_30_plus),
    }));
  }, [rows, cohort]);

  return (
    <section id="vintage">
      <h2 className="section-title">
        Vintage cohorts <VizInfo text={VIZ_COPY.vintage} />
        <span className="month-pill">Cohort view</span>
      </h2>
      <p className="section-desc">
        <strong>What this is for:</strong> compare how DQ rates evolve as loans <em>age on book</em> within one
        origination quarter (Freddie file vintage)—independent of the header reporting month and chart clicks elsewhere.
        X-axis = seasoning months; Y-axis = 30+ DQ rate. Defaults to the <strong>earliest</strong> cohort in the mart;
        pick another quarter from the dropdown. Hover <strong>i</strong> for detail.
      </p>
      <div style={{ marginBottom: "0.75rem" }}>
        <label className="muted" htmlFor="cohort">
          Cohort{" "}
        </label>
        <select
          id="cohort"
          value={cohort}
          onChange={(e) => setCohort(e.target.value)}
          style={{
            marginLeft: 8,
            background: "#121922",
            color: "var(--text)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "0.35rem 0.5rem",
          }}
        >
          {cohorts.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="chart-wrap">
        <div className="chart-title-row">
          <span>Delinquency rate by vintage age (months since cohort start)</span>
        </div>
        <div style={{ width: "100%", height: 340 }}>
          <ResponsiveContainer>
            <LineChart data={series} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#243044" />
              <XAxis
                dataKey="vm"
                tick={{ fill: "#8b9bb0", fontSize: 11 }}
                name="Vintage month"
                allowDecimals={false}
              />
              <YAxis
                tick={{ fill: "#8b9bb0", fontSize: 11 }}
                tickFormatter={(v) => pct(v, 2)}
                domain={[0, "auto"]}
                tickCount={6}
              />
              <Tooltip
                contentStyle={{ background: "#121922", border: "1px solid #243044" }}
                formatter={(v: number, name: string) => [pct(v, 2), name]}
                labelFormatter={(vm) => `Month ${vm} on book`}
              />
              <Legend />
              <Line type="monotone" dataKey="dr" stroke="#3dd6c3" strokeWidth={2} dot={false} name="Loan DQ rate" />
              <Line type="monotone" dataKey="dur" stroke="#8ecae6" strokeWidth={2} dot={false} name="UPB DQ rate" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
