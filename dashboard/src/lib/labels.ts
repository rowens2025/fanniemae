/** Presentation-layer labels for API snake_case values. */

const BUCKET_LABELS: Record<string, string> = {
  current: "Current",
  "30_days": "30 days",
  "60_days": "60 days",
  "90_plus": "90+ days",
  reo: "REO",
  zero_balance: "Zero balance",
  unknown: "Unknown (XX)",
  other: "Other (unmapped code)",
  no_prior: "No prior month",
};

export function formatDelinquencyBucket(raw: string): string {
  const k = String(raw).trim().toLowerCase();
  if (BUCKET_LABELS[k]) return BUCKET_LABELS[k];
  return humanizeSnake(String(raw));
}

const METRIC_LABELS: Record<string, string> = {
  active_loan_count: "Active loan count",
  active_upb: "Active UPB",
  delinq_30plus_loan_count: "30+ delinquent loan count",
  delinq_30plus_upb: "30+ delinquent UPB",
  delinquency_rate_30_plus: "30+ delinquency rate (loans)",
  delinquency_upb_rate_30_plus: "30+ delinquency rate (UPB)",
};

export function formatMetricName(api: string): string {
  return METRIC_LABELS[api] ?? humanizeSnake(api);
}

const METHOD_LABELS: Record<string, string> = {
  classic_z: "Classic z-score",
  robust_z: "Robust z-score",
  percentile_rank: "Percentile rank",
};

export function formatMethodName(raw: string): string {
  const k = String(raw).trim().toLowerCase();
  if (METHOD_LABELS[k]) return METHOD_LABELS[k];
  return humanizeSnake(raw);
}

const PROFILE_LABELS: Record<string, string> = {
  insufficient_history: "Insufficient history",
  near_normal: "Near-normal",
  moderate_skew: "Moderate skew",
  heavy_tails: "Heavy tails",
  bounded: "Bounded",
};

export function formatDistributionProfile(raw: string): string {
  const k = String(raw).trim().toLowerCase();
  if (PROFILE_LABELS[k]) return PROFILE_LABELS[k];
  return humanizeSnake(raw);
}

function humanizeSnake(s: string): string {
  const parts = String(s)
    .split(/_+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (!parts.length) return s;
  const out = parts.map((p) => {
    if (/^\d+[a-z]*$/i.test(p)) return p.toLowerCase();
    if (p.toLowerCase() === "plus") return "+";
    return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
  });
  let r = out.join(" ").replace(/(\d)\s\+\s/g, "$1+ ");
  r = r.replace(/\bUpb\b/g, "UPB").replace(/\bReo\b/g, "REO");
  return r;
}
