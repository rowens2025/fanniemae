# Mortgage analytics dashboard

Single-page React UI for reviewing **Neon marts** built with dbt (`analytics_mart_mortgage.*`): KPI significance (Wilson, anomaly routing), roll-forward, vintage cohorts, and delinquency bucket mix.

## Run locally

1. From the **repo root**, ensure `.env` contains `DATABASE_URL` (Neon).
2. Install and start the API + Vite dev server:

```bash
cd dashboard
npm install
npm run dev
```

3. Open **http://localhost:5173**. The Vite dev server proxies `/api` to the Express API on **http://127.0.0.1:3847** (override with `DASHBOARD_API_PORT`).

## Layout (easy review)

| Area | File |
|------|------|
| Shell + nav | `src/App.tsx` |
| Overview cards | `src/components/DashboardOverview.tsx` |
| Trends / Wilson / MoM / anomaly score | `src/components/DashboardTrends.tsx` |
| Long-format KPI table (latest month) | `src/components/DashboardAnomalies.tsx` |
| Roll-forward bars | `src/components/DashboardRoll.tsx` |
| Vintage cohort chart | `src/components/DashboardVintage.tsx` |
| Bucket mix stacked areas | `src/components/DashboardBuckets.tsx` |
| Methodology blurb | `src/components/DashboardMethodology.tsx` |
| API routes (local dev) | `server/index.js` |
| API routes (Vercel) | `api/*.js` + `api/_lib/pool.js` |

## Production build

```bash
npm run build
```

**Vercel:** deploy this folder with `vercel`; serverless handlers under `api/` serve `/api/*`. See [DEPLOY.md](./DEPLOY.md).

**Other hosts:** serve `dist/` as static files and run the Express API (or port the SQL to your backend).
