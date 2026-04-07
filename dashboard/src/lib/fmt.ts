/**
 * Calendar month label YYYY-MM using UTC (matches Postgres `date` serialized as ISO in JSON).
 */
export function monthLabel(d: string | Date): string {
  const s = typeof d === "string" ? d.trim() : d;
  const x = typeof s === "string" ? new Date(s) : s;
  if (Number.isNaN(x.getTime())) {
    const m = String(d).match(/^(\d{4}-\d{2})/);
    return m ? m[1]! : String(d);
  }
  const y = x.getUTCFullYear();
  const mo = x.getUTCMonth() + 1;
  return `${y}-${String(mo).padStart(2, "0")}`;
}

/**
 * Normalize any API `reporting_month` to YYYY-MM-01 for comparisons and `/api/kpi-long?month=`.
 */
export function reportingMonthKey(input: unknown): string {
  if (input == null || input === "") return "";
  const s = String(input).trim();
  const isoDay = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDay) return `${isoDay[1]}-${isoDay[2]}-${isoDay[3]}`;
  const ym = s.match(/^(\d{4})-(\d{2})$/);
  if (ym) return `${ym[1]}-${ym[2]}-01`;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  const y = d.getUTCFullYear();
  const mo = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  return `${y}-${String(mo).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function pct(x: unknown, digits = 2): string {
  if (x === null || x === undefined) return "—";
  const n = Number(x);
  if (Number.isNaN(n)) return "—";
  return `${(n * 100).toFixed(digits)}%`;
}

export function num(x: unknown, digits = 0): string {
  if (x === null || x === undefined) return "—";
  const n = Number(x);
  if (Number.isNaN(n)) return "—";
  return n.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

export function compact(x: unknown): string {
  if (x === null || x === undefined) return "—";
  const n = Number(x);
  if (Number.isNaN(n)) return "—";
  return n.toLocaleString(undefined, {
    notation: "compact",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
}

/** Percentage points (delta), two decimals, e.g. 0.00123 → "0.12pp" */
export function pp(x: unknown, digits = 2): string {
  if (x === null || x === undefined) return "—";
  const n = Number(x);
  if (Number.isNaN(n)) return "—";
  return `${(n * 100).toFixed(digits)}pp`;
}
