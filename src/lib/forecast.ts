import type { Forecast, ModelRisk, Observation } from "./types";
import { manilaToday, nextMonth } from "./dates";
export const MONTHLY_SOURCE = "ncr_dengue_monthly_with_rates.csv";
export const METHOD = "monthly-wma-3-q50-q80-v1";
const excludedFlags = new Set([
  "partial_2021_coverage",
  "missing_week_in_source",
  "deaths_exceed_cases",
  "aggregate_contains_suspect_weekly_values",
  "aggregate_contains_missing_deaths",
]);
export function quantile(sorted: number[], fraction: number): number {
  if (!sorted.length) throw new Error("Quantile requires observations.");
  const rank = (sorted.length - 1) * fraction;
  const low = Math.floor(rank),
    high = Math.ceil(rank);
  return sorted[low] + (sorted[high] - sorted[low]) * (rank - low);
}
export function completeMonth(row: Observation, today: string): boolean {
  if (
    row.period_type !== "month" ||
    row.source !== MONTHLY_SOURCE ||
    nextMonth(row.period_start) > today
  )
    return false;
  if (row.quality_flags.some((flag) => excludedFlags.has(flag))) return false;
  // Monthly source groups Sunday-labelled weekly records, not calendar onset dates.
  // Completeness means every expected Sunday label is present, not certified reporting.
  const start = new Date(row.period_start + "T00:00:00Z");
  const end = new Date(nextMonth(row.period_start) + "T00:00:00Z");
  let sundays = 0;
  for (
    const day = new Date(start);
    day < end;
    day.setUTCDate(day.getUTCDate() + 1)
  )
    if (day.getUTCDay() === 0) sundays++;
  return row.weeks_reported === sundays;
}
export function computeForecast(
  lguId: string,
  observations: Observation[],
  today = manilaToday(),
): Omit<Forecast, "computed_at" | "input_digest"> {
  const rows = observations
    .filter(
      (row) =>
        row.lgu_id === lguId &&
        row.period_type === "month" &&
        row.source === MONTHLY_SOURCE,
    )
    .sort((a, b) => a.period_start.localeCompare(b.period_start));
  const eligible = rows.filter((row) => completeMonth(row, today));
  const values = eligible.map((row) => row.cases).sort((a, b) => a - b);
  const latest = eligible.at(-1)?.period_start ?? null;
  const forecastFor = latest ? nextMonth(latest) : null;
  const base = {
    lgu_id: lguId,
    source: MONTHLY_SOURCE,
    method_version: METHOD,
    data_as_of: latest,
    forecast_for: forecastFor,
    valid_until: forecastFor ? nextMonth(forecastFor) : null,
    latest_observation: rows.at(-1)?.period_start ?? null,
    baseline_count: eligible.length,
    baseline_start: eligible[0]?.period_start ?? null,
    baseline_end: latest,
  };
  if (eligible.length < 24)
    return {
      ...base,
      predicted_cases: null,
      p50: null,
      p80: null,
      risk_label: "Insufficient data",
      input_periods: [],
      reason: "Fewer than 24 eligible complete source-label months.",
    };
  // Defense formula: for the three most recent eligible complete source-label months
  // x1 (oldest), x2, x3 (newest), F = (1*x1 + 2*x2 + 3*x3)/6.
  // Use each city's OWN eligible monthly distribution, through data_as_of only:
  // Qp = linear interpolation at zero-based rank (n-1)*p, p=.50 and .80.
  // Low if F <= Q50; Medium if Q50 < F <= Q80; High if F > Q80.
  // Require n>=24 and Q80>Q50; otherwise insufficient. No community counts,
  // weekly duplicates, daily observations, partial months, or flagged suspect
  // values enter the model. Eligible months may skip gaps; expose their dates.
  // This is a one-month historical baseline, not a validated medical alert model.
  const input = eligible
    .slice(-3)
    .map((row, index) => ({
      date: row.period_start,
      cases: row.cases,
      weight: index + 1,
    }));
  const predicted =
    input.reduce((sum, row) => sum + row.cases * row.weight, 0) / 6;
  const p50 = quantile(values, 0.5),
    p80 = quantile(values, 0.8);
  const risk: ModelRisk =
    p80 <= p50
      ? "Insufficient data"
      : predicted <= p50
        ? "Low"
        : predicted <= p80
          ? "Medium"
          : "High";
  return {
    ...base,
    predicted_cases: predicted,
    p50,
    p80,
    risk_label: risk,
    input_periods: input,
    reason:
      risk === "Insufficient data"
        ? "The historical thresholds are not distinct enough to separate tiers."
        : "Relative to this city’s eligible historical monthly distribution; not an official alert.",
  };
}
export function currentRisk(
  forecast: Forecast | undefined,
  today = manilaToday(),
): ModelRisk {
  if (
    !forecast?.forecast_for ||
    !forecast.valid_until ||
    today < forecast.forecast_for ||
    today >= forecast.valid_until
  )
    return "Insufficient data";
  return forecast.risk_label;
}
export function historicalOnly(
  forecast: Forecast,
  today = manilaToday(),
): boolean {
  return (
    !forecast.forecast_for ||
    !forecast.valid_until ||
    today < forecast.forecast_for ||
    today >= forecast.valid_until
  );
}
