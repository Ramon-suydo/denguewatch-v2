export type PeriodType = "month" | "week" | "day";
export interface City {
  id: string;
  name: string;
  psgc_code: string | null;
  population: number | null;
  population_year: number | null;
  population_source: string | null;
}
export interface Observation {
  id: number;
  lgu_id: string;
  period_start: string;
  period_type: PeriodType;
  cases: number;
  source: string;
  source_citation: string;
  incidence_per_100k: number | null;
  population: number | null;
  population_year: number | null;
  weeks_reported: number | null;
  quality_flags: string[];
}
export type ModelRisk = "Low" | "Medium" | "High" | "Insufficient data";
export interface Forecast {
  lgu_id: string;
  source: string;
  method_version: string;
  data_as_of: string | null;
  forecast_for: string | null;
  valid_until: string | null;
  latest_observation: string | null;
  predicted_cases: number | null;
  p50: number | null;
  p80: number | null;
  risk_label: ModelRisk;
  baseline_count: number;
  baseline_start: string | null;
  baseline_end: string | null;
  input_periods: { date: string; cases: number; weight: number }[];
  reason: string;
  computed_at: string;
  input_digest: string;
}
export interface CommunityWeek {
  lgu_id: string;
  week_start: string;
  report_count: number;
}
export interface CommunityPolicy {
  id: boolean;
  retention_days: number;
  contact_email: string | null;
  submissions_enabled: boolean;
  consent_version: string;
}
