import { SCHEMA, runQuery, preflight } from "./_lib/pool.js";

export default async function handler(req, res) {
  if (preflight(req, res)) return;
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const limitRaw = req.query?.limit;
  const limit = Math.min(Number(limitRaw) || 1200, 5000);
  const q = `
    select reporting_month, from_delinquency_bucket, to_delinquency_bucket,
           loan_count, total_current_actual_upb
    from ${SCHEMA}.fct_delinquency_rollforward
    order by reporting_month desc, loan_count desc
    limit $1
  `;
  try {
    const r = await runQuery(q, [limit]);
    res.status(200).json({ rows: r.rows });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
}
