import { useEffect, useState } from "react";

export type LoadState<T> =
  | { status: "idle" | "loading" }
  | { status: "ok"; data: T }
  | { status: "err"; message: string };

async function j<T>(path: string): Promise<T> {
  const r = await fetch(path);
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return r.json() as Promise<T>;
}

export function useDashboardData(selectedMonth?: string) {
  const [kpiWide, setKpiWide] = useState<LoadState<{ rows: Record<string, unknown>[] }>>({
    status: "loading",
  });
  const [buckets, setBuckets] = useState<LoadState<{ rows: Record<string, unknown>[] }>>({
    status: "loading",
  });
  const [roll, setRoll] = useState<LoadState<{ rows: Record<string, unknown>[] }>>({
    status: "loading",
  });
  const [vintage, setVintage] = useState<LoadState<{ rows: Record<string, unknown>[] }>>({
    status: "loading",
  });
  const [kpiLong, setKpiLong] = useState<LoadState<{ rows: Record<string, unknown>[] }>>({
    status: "loading",
  });

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setKpiWide({ status: "loading" });
      setBuckets({ status: "loading" });
      setRoll({ status: "loading" });
      setVintage({ status: "loading" });
      try {
        const [a, b, c, d] = await Promise.all([
          j<{ rows: Record<string, unknown>[] }>("/api/kpi-wide"),
          j<{ rows: Record<string, unknown>[] }>("/api/portfolio-buckets"),
          j<{ rows: Record<string, unknown>[] }>("/api/rollforward?limit=1200"),
          j<{ rows: Record<string, unknown>[] }>("/api/vintage"),
        ]);
        if (cancelled) return;
        setKpiWide({ status: "ok", data: { rows: a.rows ?? [] } });
        setBuckets({ status: "ok", data: { rows: b.rows ?? [] } });
        setRoll({ status: "ok", data: { rows: c.rows ?? [] } });
        setVintage({ status: "ok", data: { rows: d.rows ?? [] } });
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        setKpiWide({ status: "err", message });
        setBuckets({ status: "err", message });
        setRoll({ status: "err", message });
        setVintage({ status: "err", message });
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setKpiLong({ status: "loading" });
      try {
        const month = (selectedMonth ?? "").trim();
        const path = month ? `/api/kpi-long?month=${encodeURIComponent(month)}` : "/api/kpi-long";
        const e = await j<{ rows: Record<string, unknown>[] }>(path);
        if (cancelled) return;
        setKpiLong({ status: "ok", data: { rows: e.rows ?? [] } });
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        setKpiLong({ status: "err", message });
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [selectedMonth]);

  return { kpiWide, buckets, roll, vintage, kpiLong };
}
