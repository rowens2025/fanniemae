import { SCHEMA, getPool, preflight } from "./_lib/pool.js";

export default async function handler(req, res) {
  if (preflight(req, res)) return;
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const q = `
    select vintage_year, vintage_quarter, vintage_month, reporting_month,
           distinct_loan_count, total_current_actual_upb,
           delinquency_rate_30_plus, delinquency_upb_rate_30_plus,
           active_loan_records, active_upb, delinq_30plus_loan_records, delinq_30plus_upb
    from ${SCHEMA}.fct_vintage_monthly
    order by vintage_year, vintage_quarter, vintage_month, reporting_month
  `;
  try {
    const r = await getPool().query(q);
    res.status(200).json({ rows: r.rows });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
}
