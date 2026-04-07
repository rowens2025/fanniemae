import { SCHEMA, runQuery, preflight } from "./_lib/pool.js";

export default async function handler(req, res) {
  if (preflight(req, res)) return;
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const q = `
    select *
    from ${SCHEMA}.fct_portfolio_metric_significance_monthly_wide
    order by reporting_month asc
  `;
  try {
    const r = await runQuery(q);
    res.status(200).json({ rows: r.rows });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
}
