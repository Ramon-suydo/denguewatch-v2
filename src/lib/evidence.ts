import type { ManilaWeek } from "../../scripts/lib/manila-data";
import type { Model } from "../../scripts/lib/manila-model";
export type Scenario = "Z" | "M";
export type Forecast = {
  model: Model;
  origin: string;
  target: string;
  horizon: number;
  predicted: number;
  low80: number | null;
  high80: number | null;
  riseProbability: number | null;
  alertProbability: number | null;
  threshold: number | null;
};
export type Summary = {
  scenario: string;
  horizon: number;
  model: string;
  fold: string;
  n: number;
  mae: number | null;
  rmse: number | null;
  mase: number | null;
  skillPercent: number | null;
  coverage80: number | null;
  precision: number | null;
  recall: number | null;
  f1: number | null;
  rocAuc: number | null;
  brier: number | null;
  falseAlarmRate: number | null;
  skill95: { low: number | null; high: number | null } | null;
};
export type Evidence = {
  version: number;
  data_as_of: string;
  historical_only: boolean;
  community_included: boolean;
  series: Record<Scenario, ManilaWeek[]>;
  snapshots: {
    scenario: Scenario;
    as_of: string;
    model: string;
    model_version: string;
    current_risk: {
      level: string;
      reason: string;
      historical_level: string;
      historical_threshold: number | null;
    };
    forecasts: Forecast[];
    year_comparison: {
      year: number;
      observed_week_count: number;
      calendar_week_count: number;
      scorable_cases: number;
      complete: boolean;
    }[];
  }[];
  summaries: Summary[];
  episode_leads?: {
    horizon_set: string;
    scenario: string;
    model: string;
    eligible_onsets: number;
    detected_onsets: number;
    mean_lead_weeks: number | null;
  }[];
  drivers?: {
    scenario: string;
    model: string;
    origin: string;
    interpretation: string;
    rows: { name: string; value: number }[];
  }[];
  metadata: {
    version: string;
    limitations: string[];
    ridge: string;
    tree: string;
    weather: string;
    threshold: string;
    intervals: string;
    protocol: string;
    bootstrap: string;
  };
};
export type NcrEvidence = {
  version: number;
  data_as_of: string;
  banner: string;
  historical_only: boolean;
  populations: { city: string; population_2020: number; status: string }[];
  rows: { city: string; week_ending: string; cases: number; flags: string[] }[];
  shapes: { city: string; path: string; center: [number, number] }[];
  boundary_source: { url: string; license: string; validOn: string };
};
const memory = new Map<string, unknown>();
async function json(path: string, signal: AbortSignal) {
  if (!navigator.onLine && memory.has(path)) return memory.get(path) as any;
  const response = await fetch(path, { signal });
  if (!response.ok)
    throw Error("Bundled research data could not load. Reconnect or retry.");
  const data = await response.json();
  if (data.version !== 2 || data.historical_only !== true)
    throw Error("Unsupported research dataset version.");
  memory.set(path, data);
  return data;
}
export const loadEvidence = async (signal: AbortSignal): Promise<Evidence> => {
  const data = await json("/api/v2/manila.json", signal);
  if (
    !Array.isArray(data.series?.M) ||
    !Array.isArray(data.series?.Z) ||
    !Array.isArray(data.snapshots) ||
    data.community_included !== false
  )
    throw Error("Research data failed validation.");
  return data;
};
export const loadNcr = async (signal: AbortSignal): Promise<NcrEvidence> => {
  const data = await json("/api/v2/ncr.json", signal);
  if (
    data.shapes?.length !== 17 ||
    data.populations?.length !== 17 ||
    !Array.isArray(data.rows)
  )
    throw Error("Historical NCR data failed validation.");
  return data;
};
export const number = (value: number | null | undefined, digits = 1) =>
  value == null
    ? "Unavailable"
    : value.toLocaleString("en-PH", { maximumFractionDigits: digits });
export const percent = (value: number | null | undefined) =>
  value == null ? "Unavailable" : number(value * 100) + "%";
