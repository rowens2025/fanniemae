/**
 * Long-form copy for (i) hovers and methodology — keep in sync.
 */
export const VIZ_COPY = {
  overview: `Executive KPIs for the reporting month you choose in the header. Wilson 95% bands apply only to the loan-count 30+ delinquency proportion (binomial). UPB and counts are shown for scale; MoM deltas summarize month-over-month change. Primary anomaly reflects the routed score for the DQ rate metric.`,

  trendsPrimary: `Time series of the 30+ loan delinquency rate. Historical (24m) draws a 10th–90th percentile envelope from the prior 24 months (excluding the current point). Wilson overlays the SQL Wilson interval for that month. Optional secondary axis compares UPB, active loans, or the primary anomaly score. Click the chart to set the global reporting month.`,

  trendsMom: `Change in the portfolio 30+ loan DQ rate vs the prior month (purple) and vs the same month last year (orange). Values are percentage points on the rate (e.g. +0.05pp means the rate rose by five basis points). The first month has no MoM point; the first 12 months have no YoY point.`,

  trendsAnomaly: `Z-style score: how far this month’s DQ rate sits from the midpoint of its trailing-24-month historical band, in units of half the band width. Reference lines at ±2 flag strong moves.`,

  trendsUpb: `Compares the loan-count 30+ rate with the UPB-weighted 30+ rate. UPB weighting is not a binomial proportion; interpret spread as composition vs severity.`,

  anomalies: `Each row is one KPI in the long mart. Trailing-12-month distribution shape (skew, kurtosis, etc.) picks a detector: classic z, robust z, or percentile rank. The table shows candidates; the primary score is the unified review field.`,

  roll: `Rows are “from” delinquency status at the start of the reporting month (prior month’s bucket, or “No prior month” for a loan’s first row). Columns are “to” at month-end. Rate mode: cell ÷ row total = transition share from that “from” bucket. Count mode: raw loan counts.

OTHER (unmapped code): Fannie Mae delinquency status codes that are not mapped to Current / 30 / 60 / 90+ / REO / Unknown(XX) land here—often rare or newer codes worth auditing in staging SQL.

UNKNOWN (XX): explicit XX/unknown codes from the file.

ZERO BALANCE row often looks empty: few loans have a prior-month snapshot classified as zero-balance while still appearing in the monthly performance join used for rolls—many paid-off loans drop from the panel, so there is little mass to transition from that row.`,

  buckets: `Stacked shares of loans by delinquency bucket from the monthly portfolio mart. “All” shows each bucket’s share of the full portfolio. “Delinquent-only” drops Current and re-normalizes the remaining buckets so you see how distress mixes without the current bucket dominating. Unknown / other can appear if the source file maps rare codes there—worth validating upstream if the slice looks large. Click the chart to set the reporting month.`,

  vintage: `Goal: see how delinquency evolves as a vintage seasons—same cohort of loans (Fannie Mae file origination quarter), x-axis = months on book since that cohort started, y-axis = DQ rate. Independent of the header reporting month and other chart clicks.

Defaults to the earliest cohort in the mart (chronological). Newest quarters only have a handful of seasoning months, so the curve looks short—pick an older quarter for a full arc. Teal = loan-count 30+ rate; blue = UPB-weighted 30+ rate.`,
} as const;

export const METHODOLOGY_PARAS = {
  dataPath: `Data flows from raw Fannie Mae loan-level files through dbt into Neon analytics marts (schema used by this UI).`,

  wilson: `Wilson 95% intervals apply to the loan-count 30+ delinquency proportion (treats delinquent vs not as binomial).`,

  upb: `UPB-weighted delinquency rates are not binomial; bands in SQL (where present) use normal approximations and are labeled accordingly.`,

  anomaly: `Anomaly routing uses trailing-12-month shape statistics on each KPI to choose classic z-score, robust z-score, or percentile rank, then surfaces a unified primary anomaly score for review.`,

  rollVintage: `Roll-forward: transitions for the selected reporting month. “Other” in rolls means delinquency status codes not mapped in dbt (catch-all). Vintage: one origination quarter vs months on book (seasoning), not calendar month.`,
} as const;
