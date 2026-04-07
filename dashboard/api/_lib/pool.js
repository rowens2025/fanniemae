import pg from "pg";

let pool;

export const SCHEMA = "analytics_mart_mortgage";

export function getPool() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  if (!pool) {
    pool = new pg.Pool({
      connectionString: url,
      max: 2,
      idleTimeoutMillis: 20000,
      connectionTimeoutMillis: 10000,
      ssl: url.includes("neon.tech") ? { rejectUnauthorized: false } : undefined,
    });
  }
  return pool;
}

/** CORS for browser + optional iframe embed from another origin */
export function applyCors(req, res) {
  const allow = process.env.DASHBOARD_CORS_ORIGIN || "*";
  res.setHeader("Access-Control-Allow-Origin", allow === "*" ? "*" : allow);
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export function preflight(req, res) {
  applyCors(req, res);
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }
  return false;
}
