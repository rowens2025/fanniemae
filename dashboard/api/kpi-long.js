import { SCHEMA, getPool, preflight } from "./_lib/pool.js";

export default async function handler(req, res) {
  if (preflight(req, res)) return;
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const month = String(req.query?.month ?? "").trim();
  const q =
    month.length > 0
      ? `
    select *
    from ${SCHEMA}.fct_portfolio_metric_significance_monthly
    where reporting_month = $1::date
    order by metric_name
  `
      : `
    select *
    from ${SCHEMA}.fct_portfolio_metric_significance_monthly
    where reporting_month = (select max(reporting_month) from ${SCHEMA}.fct_portfolio_metric_significance_monthly)
    order by metric_name
  `;
  try {
    const r = month.length > 0 ? await getPool().query(q, [month]) : await getPool().query(q);
    res.status(200).json({ rows: r.rows });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
}
