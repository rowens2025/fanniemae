import { useMemo, useState } from "react";
import { formatDelinquencyBucket } from "../lib/labels";
import { monthLabel, num, pct, reportingMonthKey } from "../lib/fmt";
import { VIZ_COPY } from "../lib/vizCopy";
import { VizInfo } from "./VizInfo";

type Row = Record<string, unknown>;

const BUCKET_ORDER = ["current", "30_days", "60_days", "90_plus", "reo", "zero_balance", "unknown", "other"];

function clamp01(x: number) {
  if (Number.isNaN(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function heatColor(t: number) {
  const x = clamp01(t);
  const a = [61, 214, 195];
  const b = [124, 108, 255];
  const c = [244, 162, 97];
  const mix = (u: number, v: number, p: number) => Math.round(u + (v - u) * p);
  const seg = x < 0.65 ? x / 0.65 : (x - 0.65) / 0.35;
  const from = x < 0.65 ? a : b;
  const to = x < 0.65 ? b : c;
  const r = mix(from[0], to[0], seg);
  const g = mix(from[1], to[1], seg);
  const bl = mix(from[2], to[2], seg);
  return `rgba(${r}, ${g}, ${bl}, 0.85)`;
}

export function DashboardRollMatrix({
  rows,
  selectedMonth,
  onSelectMonth,
}: {
  rows: Row[];
  selectedMonth: string;
  onSelectMonth: (m: string) => void;
}) {
  const [mode, setMode] = useState<"rate" | "count">("rate");

  const latestMonth = useMemo(() => {
    if (!rows.length) return "";
    const sorted = [...rows].sort((a, b) =>
      reportingMonthKey(b.reporting_month).localeCompare(reportingMonthKey(a.reporting_month)),
    );
    return reportingMonthKey(sorted[0]?.reporting_month ?? "");
  }, [rows]);

  const month = selectedMonth || latestMonth;
  const monthDisplay = month ? monthLabel(month) : "—";

  const matrix = useMemo(() => {
    const mk = reportingMonthKey(month);
    const slice = rows.filter((r) => reportingMonthKey(r.reporting_month) === mk);
    const buckets = new Set<string>();
    for (const r of slice) {
      buckets.add(String(r.from_delinquency_bucket));
      buckets.add(String(r.to_delinquency_bucket));
    }
    const ordered = [
      ...BUCKET_ORDER.filter((b) => buckets.has(b)),
      ...[...buckets].filter((b) => !BUCKET_ORDER.includes(b)).sort(),
    ];

    const cell = new Map<string, number>();
    const rowSum = new Map<string, number>();
    for (const r of slice) {
      const f = String(r.from_delinquency_bucket);
      const t = String(r.to_delinquency_bucket);
      const n = Number(r.loan_count ?? 0);
      cell.set(`${f}→${t}`, (cell.get(`${f}→${t}`) ?? 0) + n);
      rowSum.set(f, (rowSum.get(f) ?? 0) + n);
    }

    let maxRate = 0;
    let maxCount = 0;
    for (const f of ordered) {
      for (const t of ordered) {
        const c = cell.get(`${f}→${t}`) ?? 0;
        maxCount = Math.max(maxCount, c);
        const rs = rowSum.get(f) ?? 0;
        const r = rs > 0 ? c / rs : 0;
        maxRate = Math.max(maxRate, r);
      }
    }

    return { ordered, cell, rowSum, maxRate, maxCount };
  }, [rows, month]);

  const title = mode === "rate" ? "Roll rate (row-normalized)" : "Roll volume (loan count)";

  return (
    <section id="roll">
      <div className="section-head">
        <div>
          <h2 className="section-title">
            Roll rate <VizInfo text={VIZ_COPY.roll} />
            <span className="month-pill">{monthDisplay}</span>
          </h2>
          <p className="section-desc">
            Transition matrix for <strong>{monthDisplay}</strong> (same month as the header selector). Click month
            charts above to change it.
          </p>
        </div>
        <div className="segmented segmented-spaced">
          <button type="button" className={`seg-btn ${mode === "rate" ? "active" : ""}`} onClick={() => setMode("rate")}>
            Rate
          </button>
          <button type="button" className={`seg-btn ${mode === "count" ? "active" : ""}`} onClick={() => setMode("count")}>
            Count
          </button>
        </div>
      </div>

      <div className="chart-wrap">
        <div className="chart-title-row">
          <span>{title}</span>
          <VizInfo text={VIZ_COPY.roll} label="About the roll matrix and bucket labels" />
        </div>
        <div className="heat-wrap">
          <table className="heat">
            <thead>
              <tr>
                <th className="heat-corner">From \ To</th>
                {matrix.ordered.map((t) => (
                  <th key={t} className="heat-col">
                    {formatDelinquencyBucket(t)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.ordered.map((f) => {
                const denom = matrix.rowSum.get(f) ?? 0;
                const fLabel = formatDelinquencyBucket(f);
                return (
                  <tr key={f}>
                    <th className="heat-row">{fLabel}</th>
                    {matrix.ordered.map((t) => {
                      const c = matrix.cell.get(`${f}→${t}`) ?? 0;
                      const r = denom > 0 ? c / denom : 0;
                      const v = mode === "rate" ? r : c;
                      const scale = mode === "rate" ? (matrix.maxRate ? v / matrix.maxRate : 0) : matrix.maxCount ? v / matrix.maxCount : 0;
                      const bg = heatColor(scale);
                      const txt = mode === "rate" ? pct(r, 2) : num(c, 0);
                      const tLabel = formatDelinquencyBucket(t);
                      const tip =
                        mode === "rate"
                          ? `${fLabel} → ${tLabel}: ${pct(r, 2)} (${num(c, 0)} loans)`
                          : `${fLabel} → ${tLabel}: ${num(c, 0)} loans (${pct(r, 2)} of row)`;
                      return (
                        <td key={t} className="heat-cell" style={{ background: bg }} title={tip}>
                          {c === 0 ? "" : txt}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
