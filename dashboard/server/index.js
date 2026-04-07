/**
 * Read-only API for Neon / Postgres marts. Loads DATABASE_URL from repo root .env.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const SCHEMA = "analytics_mart_mortgage";
const PORT = Number(process.env.DASHBOARD_API_PORT || 3847);

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 8,
  ssl: process.env.DATABASE_URL?.includes("neon.tech") ? { rejectUnauthorized: false } : undefined,
});

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", async (_req, res) => {
  try {
    const r = await pool.query("select 1 as ok");
    res.json({ ok: true, db: r.rows[0]?.ok === 1 });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

app.get("/api/kpi-wide", async (_req, res) => {
  const q = `
    select *
    from ${SCHEMA}.fct_portfolio_metric_significance_monthly_wide
    order by reporting_month asc
  `;
  try {
    const r = await pool.query(q);
    res.json({ rows: r.rows });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

app.get("/api/portfolio-buckets", async (_req, res) => {
  const q = `
    select reporting_month, delinquency_bucket,
           distinct_loan_count, total_current_actual_upb,
           loan_share_of_month, upb_share_of_month
    from ${SCHEMA}.fct_portfolio_monthly
    order by reporting_month asc, delinquency_bucket asc
  `;
  try {
    const r = await pool.query(q);
    res.json({ rows: r.rows });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

app.get("/api/rollforward", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 800, 5000);
  const q = `
    select reporting_month, from_delinquency_bucket, to_delinquency_bucket,
           loan_count, total_current_actual_upb
    from ${SCHEMA}.fct_delinquency_rollforward
    order by reporting_month desc, loan_count desc
    limit $1
  `;
  try {
    const r = await pool.query(q, [limit]);
    res.json({ rows: r.rows });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

app.get("/api/vintage", async (_req, res) => {
  const q = `
    select vintage_year, vintage_quarter, vintage_month, reporting_month,
           distinct_loan_count, total_current_actual_upb,
           delinquency_rate_30_plus, delinquency_upb_rate_30_plus,
           active_loan_records, active_upb, delinq_30plus_loan_records, delinq_30plus_upb
    from ${SCHEMA}.fct_vintage_monthly
    order by vintage_year, vintage_quarter, vintage_month, reporting_month
  `;
  try {
    const r = await pool.query(q);
    res.json({ rows: r.rows });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

app.get("/api/kpi-long-latest", async (_req, res) => {
  const q = `
    select *
    from ${SCHEMA}.fct_portfolio_metric_significance_monthly
    where reporting_month = (select max(reporting_month) from ${SCHEMA}.fct_portfolio_metric_significance_monthly)
    order by metric_name
  `;
  try {
    const r = await pool.query(q);
    res.json({ rows: r.rows });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

app.get("/api/kpi-long", async (req, res) => {
  const month = String(req.query.month ?? "").trim();
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
    const r = month.length > 0 ? await pool.query(q, [month]) : await pool.query(q);
    res.json({ rows: r.rows });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

app.listen(PORT, () => {
  console.log(`Dashboard API http://127.0.0.1:${PORT}`);
});
