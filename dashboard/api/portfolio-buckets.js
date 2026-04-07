import { SCHEMA, getPool, preflight } from "./_lib/pool.js";

export default async function handler(req, res) {
  if (preflight(req, res)) return;
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const q = `
    select reporting_month, delinquency_bucket,
           distinct_loan_count, total_current_actual_upb,
           loan_share_of_month, upb_share_of_month
    from ${SCHEMA}.fct_portfolio_monthly
    order by reporting_month asc, delinquency_bucket asc
  `;
  try {
    const r = await getPool().query(q);
    res.status(200).json({ rows: r.rows });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
}
