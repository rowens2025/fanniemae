# Deploy mortgage dashboard to Vercel

This app is a **Vite static frontend** plus **Vercel Serverless Functions** under `/api/*` (same paths as local Express).

## What you do (I cannot log into your Vercel account)

1. Install CLI: `npm i -g vercel`
2. From this `dashboard` folder: `vercel login` then `vercel` (preview) or `vercel --prod`.
3. In the Vercel project **Settings → Environment Variables**, add:
   - `DATABASE_URL` — use Neon’s **pooled** connection string (Dashboard → connect → “Pooled connection” / pooler host). It tolerates serverless cold starts better than the direct string. Same DB as local dbt/UI.

Optional:

- `DASHBOARD_CORS_ORIGIN` — set to your Power Visualize site origin (e.g. `https://yoursite.vercel.app`) if you want to lock down CORS instead of `*`.

Before production builds, run `npm run docs:sync` from `dashboard/` so `public/dbt-docs/` contains a fresh `dbt docs generate` output (requires local dbt + Neon credentials). Power Visualize embeds that site at `…/dbt-docs/` in an iframe on the mortgage project page (see the **powervisualize** repo).

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
