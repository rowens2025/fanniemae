// Legacy component kept for reference; current UI uses DashboardRollMatrix.
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { compact, monthLabel } from "../lib/fmt";

type Row = Record<string, unknown>;

export function DashboardRoll({ rows }: { rows: Row[] }) {
  const latestMonth = useMemo(() => {
    if (!rows.length) return null;
    const sorted = [...rows].sort(
      (a, b) => String(b.reporting_month).localeCompare(String(a.reporting_month)),
    );
    return sorted[0]?.reporting_month;
  }, [rows]);

  const chartData = useMemo(() => {
    if (!latestMonth) return [];
    const slice = rows.filter((r) => String(r.reporting_month) === String(latestMonth));
    const top = slice
      .map((r) => ({
        label: `${String(r.from_delinquency_bucket)} → ${String(r.to_delinquency_bucket)}`,
        n: Number(r.loan_count),
        upb: Number(r.total_current_actual_upb),
      }))
      .sort((a, b) => b.n - a.n)
      .slice(0, 18);
    return top;
  }, [rows, latestMonth]);

  return (
    <section id="roll">
      <h2 className="section-title">Roll-forward (latest month)</h2>
      <p className="section-desc">
        Bucket-to-bucket transitions for roll-rate analysis. Month:{" "}
        <strong>{latestMonth ? monthLabel(String(latestMonth)) : "—"}</strong>.
      </p>
      <div className="chart-wrap">
        <div className="chart-title">Top transitions by loan count</div>
        <div style={{ width: "100%", height: Math.max(320, chartData.length * 22) }}>
          <ResponsiveContainer>
            <BarChart layout="vertical" data={chartData} margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#243044" />
              <XAxis type="number" tick={{ fill: "#8b9bb0", fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="label"
                width={220}
                tick={{ fill: "#8b9bb0", fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{ background: "#121922", border: "1px solid #243044" }}
                formatter={(v: number, _n, p) => {
                  const upb = p?.payload?.upb as number | undefined;
                  return [`${v.toLocaleString()} loans · $${compact(upb)} UPB`, "Count"];
                }}
              />
              <Bar dataKey="n" fill="#7c6cff" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
