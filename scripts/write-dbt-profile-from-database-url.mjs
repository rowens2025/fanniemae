/**
 * Writes dbt/profiles.yml from DATABASE_URL (Postgres / Neon).
 * Used in CI and optional local one-off; keep profiles.yml out of git.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const dbtDir = path.join(repoRoot, "dbt");
const outFile = path.join(dbtDir, "profiles.yml");

function yamlSingleQuoted(s) {
  return `'${String(s).replace(/'/g, "''")}'`;
}

const urlStr = (process.env.DATABASE_URL ?? "").trim();
if (!urlStr) {
  console.error("write-dbt-profile: DATABASE_URL is not set");
  process.exit(1);
}

let u;
try {
  u = new URL(urlStr);
} catch {
  console.error("write-dbt-profile: DATABASE_URL is not a valid URL");
  process.exit(1);
}

if (!["postgres:", "postgresql:"].includes(u.protocol)) {
  console.error("write-dbt-profile: only postgres/postgresql URLs are supported");
  process.exit(1);
}

const user = decodeURIComponent(u.username || "");
const password = decodeURIComponent(u.password || "");
const host = u.hostname;
const port = u.port ? parseInt(u.port, 10) : 5432;
const dbname = (u.pathname || "/").replace(/^\//, "").split("/")[0] || "";
if (!host || !dbname) {
  console.error("write-dbt-profile: missing host or database name in URL");
  process.exit(1);
}

const sslmode = u.searchParams.get("sslmode") || "require";

const body = `mortgage_analytics:
  target: ci
  outputs:
    ci:
      type: postgres
      host: ${yamlSingleQuoted(host)}
      user: ${yamlSingleQuoted(user)}
      password: ${yamlSingleQuoted(password)}
      port: ${port}
      dbname: ${yamlSingleQuoted(dbname)}
      schema: analytics
      threads: 4
      sslmode: ${yamlSingleQuoted(sslmode)}
`;

fs.mkdirSync(dbtDir, { recursive: true });
fs.writeFileSync(outFile, body, "utf8");
console.log("write-dbt-profile: wrote", outFile);
