# Deploy mortgage dashboard to Vercel

This app is a **Vite static frontend** plus **Vercel Serverless Functions** under `/api/*` (same paths as local Express).

## What you do (I cannot log into your Vercel account)

1. Install CLI: `npm i -g vercel`
2. From this `dashboard` folder: `vercel login` then `vercel` (preview) or `vercel --prod`.
3. In the Vercel project **Settings → Environment Variables**, add:
   - `DATABASE_URL` — use Neon’s **pooled** connection string (Dashboard → connect → “Pooled connection” / pooler host). It tolerates serverless cold starts better than the direct string. Same DB as local dbt/UI.

Optional:

- `DASHBOARD_CORS_ORIGIN` — set to your Power Visualize site origin (e.g. `https://yoursite.vercel.app`) if you want to lock down CORS instead of `*`.

### dbt Docs (`/dbt-docs/`) for Power Visualize

Power Visualize loads **`https://<your-dashboard>/dbt-docs/`** in an iframe. That path must be a **static** dbt Docs site shipped in `dashboard/public/dbt-docs/` (copied to `dist/dbt-docs/` on build).

**Option A — GitHub Actions (recommended)**  
1. In the GitHub repo, add secret **`MORTGAGE_DATABASE_URL`** (same pooled Neon URL style as Vercel `DATABASE_URL`).  
2. Run workflow **“Sync dbt docs site”** (Actions tab), or push a change under `dbt/`.  
3. The workflow generates docs, commits `dashboard/public/dbt-docs/**/*`, and pushes.  
4. Redeploy the mortgage dashboard on Vercel so the new static files go live.

**Option B — Local**  
From `dashboard/`: `npm run docs:sync` (uses your normal `dbt/profiles.yml`), **or** with only `DATABASE_URL` in the environment: `npm run docs:sync:from-database-url` (writes `dbt/profiles.yml` from the URL, then runs dbt). Commit the updated `public/dbt-docs/` if you deploy without the workflow.

**Iframe embedding:** `vercel.json` sets **Content-Security-Policy `frame-ancestors`** so `powervisualize.com` and `*.vercel.app` can embed `/dbt-docs/`. Add another origin here if your marketing URL changes.

Warehouse **ERD** (dbdiagram) is configured on the **Power Visualize** Vercel project as `VITE_MORTGAGE_ERD_URL`, not on this dashboard.

## After deploy

- App URL: `https://<project>.vercel.app`
- Health check: `https://<project>.vercel.app/api/health`

## Embed on Power Visualize

1. Set `VITE_MORTGAGE_DASHBOARD_URL` in the **powervisualize** project to that URL (no trailing slash).
2. Set `VITE_MORTGAGE_ERD_URL` in **powervisualize** to your dbdiagram **embed** URL (same pattern as RyAgent’s ERD on the data-projects page).
3. Rebuild powervisualize, or paste the URL into `reports` in `App.tsx` for the mortgage entry.

## Local parity

- Dev still uses `npm run dev` (Vite + Express on 3847).
- Production on Vercel uses `/api/*` serverless handlers in `api/`, not `server/index.js`.
