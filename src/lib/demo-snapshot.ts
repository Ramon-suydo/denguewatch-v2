import type { City, Forecast, Observation } from "./types";
import type { RiskRecord } from "../components/CityGrid";
export interface DemoSnapshot {
  metadata: { version: string; createdAt: string; counts: { lgus: number; week: number; month: number; day: number }; sourceChecksums: { source: string; sha256: string }[]; backtestChecksum: string };
  cities: City[]; history: Observation[]; forecasts: Forecast[]; risks: RiskRecord[];
  coverage: { source: string; period: string; date: string | null }[];
}
const forced = import.meta.env?.VITE_DEMO_MODE === "true";
let active = false;
let date: string | null = null;
let snapshot: Promise<DemoSnapshot> | undefined;
const listeners = new Set<() => void>();
export const isSnapshotMode = () => forced || active || (typeof navigator !== "undefined" && navigator.onLine === false);
export const subscribeSnapshot = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export const snapshotDate = () => date;
export async function loadDemoSnapshot(): Promise<DemoSnapshot> {
  if (!snapshot) snapshot = fetch(`${import.meta.env?.BASE_URL ?? "/"}demo-snapshot.json`)
    .then(async response => {
      if (!response.ok) throw new Error("Snapshot unavailable");
      const data = await response.json() as DemoSnapshot;
      if (data.metadata?.version !== "demo-db-v1" || data.metadata.counts.lgus !== 17) throw new Error("Snapshot verification metadata is unavailable");
      return data;
    }).catch(() => { snapshot = undefined; throw new Error("The demo snapshot could not load. Start the local preview with the verified snapshot included."); });
  return snapshot;
}
export async function readPublished<T>(signal: AbortSignal, live: (signal: AbortSignal) => Promise<T>, cached: (snapshot: DemoSnapshot) => T | Promise<T>): Promise<T> {
  const fallback = async () => {
    active = true;
    const data = await loadDemoSnapshot();
    date = data.metadata.createdAt;
    listeners.forEach(listener => listener());
    return cached(data);
  };
  if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
  if (isSnapshotMode()) return fallback();
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let cancel: () => void = () => {};
  const cancelled = new Promise<never>((_, reject) => {
    cancel = () => { controller.abort(); reject(new DOMException("Cancelled", "AbortError")); };
    signal.addEventListener("abort", cancel, { once: true });
    timer = setTimeout(() => { controller.abort(); reject(new Error("Published read timed out")); }, 4000);
  });
  try {
    const result = await Promise.race([live(controller.signal), cancelled]);
    return isSnapshotMode() ? fallback() : result;
  } catch (error) {
    if (signal.aborted) throw error;
    return fallback();
  } finally {
    clearTimeout(timer);
    signal.removeEventListener("abort", cancel);
  }
}
export function requireOnlineMutation() {
  if (isSnapshotMode()) throw new Error("Reporting and withdrawal are unavailable in the offline demo. Nothing was submitted or queued. Reconnect and reload before using the service.");
}
