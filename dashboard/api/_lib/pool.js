import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

export const SCHEMA = "analytics_mart_mortgage";

/**
 * One-shot pool per request — recommended for Vercel serverless with Neon (avoids stale TCP
 * and plays better with cold starts than a long-lived node-pg pool with a short timeout).
 */
export async function runQuery(sqlText, params) {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  const pool = new Pool({
    connectionString: url,
    max: 1,
    connectionTimeoutMillis: 55000,
    idleTimeoutMillis: 55000,
  });
  try {
    return params === undefined ? await pool.query(sqlText) : await pool.query(sqlText, params);
  } finally {
    await pool.end();
  }
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
