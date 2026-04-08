# Deploy mortgage dashboard to Vercel

This app is a **Vite static frontend** plus **Vercel Serverless Functions** under `/api/*` (same paths as local Express).

## What you do (I cannot log into your Vercel account)

1. Install CLI: `npm i -g vercel`
2. From this `dashboard` folder: `vercel login` then `vercel` (preview) or `vercel --prod`.
3. In the Vercel project **Settings → Environment Variables**, add:
   - `DATABASE_URL` — use Neon’s **pooled** connection string (Dashboard → connect → “Pooled connection” / pooler host). It tolerates serverless cold starts better than the direct string. Same DB as local dbt/UI.

Optional:

- `DASHBOARD_CORS_ORIGIN` — set to your Power Visualize site origin (e.g. `https://yoursite.vercel.app`) if you want to lock down CORS instead of `*`.
- `VITE_MORTGAGE_RAW_ERD_URL` — embed URL for a raw-layer ERD (e.g. dbdiagram.io) shown below the charts after dbt Docs.
- `VITE_DBT_DOCS_BASE_URL` — override if dbt Docs are hosted elsewhere (default `/dbt-docs/`).

Before production builds, run `npm run docs:sync` from `dashboard/` so `public/dbt-docs/` contains a fresh `dbt docs generate` output (requires local dbt + Neon credentials).

## After deploy

- App URL: `https://<project>.vercel.app`
- Health check: `https://<project>.vercel.app/api/health`

## Embed on Power Visualize

1. Set `VITE_MORTGAGE_DASHBOARD_URL` in the **powervisualize** project to that URL (no trailing slash).
2. Rebuild powervisualize, or paste the URL into `reports` in `App.tsx` for the mortgage entry.

## Local parity

- Dev still uses `npm run dev` (Vite + Express on 3847).
- Production on Vercel uses `/api/*` serverless handlers in `api/`, not `server/index.js`.
