import { useEffect, useState } from "react";

const DEFAULT_DBT_BASE = "/dbt-docs/";

function normalizeDbtBase(url: string): string {
  const t = url.trim();
  if (!t) return DEFAULT_DBT_BASE;
  return t.endsWith("/") ? t : `${t}/`;
}

/**
 * dbt Docs & lineage first, then raw-layer ERD (dbdiagram.io embed).
 * Sync static docs: from repo root `cd dbt && dbt docs generate --target-path ../dashboard/public/dbt-docs`
 * ERD: set VITE_MORTGAGE_RAW_ERD_URL to your dbdiagram embed/share URL.
 */
export function DashboardPipelineDocs() {
  const [dbtExpanded, setDbtExpanded] = useState(false);
  const dbtBase = normalizeDbtBase(import.meta.env.VITE_DBT_DOCS_BASE_URL ?? DEFAULT_DBT_BASE);
  const erdUrl = (import.meta.env.VITE_MORTGAGE_RAW_ERD_URL ?? "").trim();

  useEffect(() => {
    if (!dbtExpanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDbtExpanded(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dbtExpanded]);

  return (
    <section id="pipeline-docs" className="pipeline-docs">
      <h2 className="section-title">Pipeline &amp; lineage</h2>
      <p className="muted" style={{ maxWidth: "52rem", marginBottom: "1.25rem" }}>
        Generated dbt documentation (graph + lineage) for this warehouse, then the raw-layer ERD for context
        on ingest tables before marts.
      </p>

      <div className="card pipeline-docs-card">
        <div className="pipeline-docs-head">
          <h3 className="pipeline-docs-title">dbt Docs — graph &amp; lineage</h3>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setDbtExpanded((v) => !v)}
            aria-expanded={dbtExpanded}
          >
            {dbtExpanded ? "Collapse" : "Expand"}
          </button>
        </div>
        {dbtExpanded && (
          <div className="pipeline-docs-backdrop" onClick={() => setDbtExpanded(false)} role="presentation" />
        )}
        <div className={dbtExpanded ? "pipeline-docs-frame-wrap pipeline-docs-frame-wrap--fullscreen" : "pipeline-docs-frame-wrap"}>
          {dbtExpanded && (
            <button
              type="button"
              className="pipeline-docs-close"
              onClick={() => setDbtExpanded(false)}
              aria-label="Close expanded dbt docs"
            >
              ×
            </button>
          )}
          <iframe
            title="dbt documentation and lineage"
            src={dbtBase}
            className="pipeline-docs-iframe pipeline-docs-iframe--dbt"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </div>
        <p className="muted" style={{ marginTop: "0.75rem", fontSize: "0.88rem" }}>
          <a href={dbtBase} target="_blank" rel="noopener noreferrer">
            Open dbt Docs in a new tab
          </a>
          {" · "}
          Run <code>npm run docs:sync</code> from <code>dashboard/</code> after <code>dbt</code> changes to refresh static files.
        </p>
      </div>

      <div className="card pipeline-docs-card" style={{ marginTop: "1.5rem" }}>
        <h3 className="pipeline-docs-title">Raw schema (ERD)</h3>
        {erdUrl ? (
          <>
            <div className="pipeline-docs-frame-wrap">
              <iframe title="Raw layer ERD" src={erdUrl} className="pipeline-docs-iframe pipeline-docs-iframe--erd" loading="lazy" />
            </div>
            <p className="muted" style={{ marginTop: "0.75rem", fontSize: "0.88rem" }}>
              <a href={erdUrl} target="_blank" rel="noopener noreferrer">
                Open ERD in a new tab
              </a>
            </p>
          </>
        ) : (
          <p className="muted" style={{ margin: 0 }}>
            Set <code>VITE_MORTGAGE_RAW_ERD_URL</code> (e.g. a dbdiagram.io embed URL) in{" "}
            <code>.env</code> / Vercel env and rebuild to show the raw <code>raw_freddie</code> (and related) ERD
            here.
          </p>
        )}
      </div>
    </section>
  );
}
