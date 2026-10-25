import { weatherFallback } from "../../src/lib/forecast-policy.ts";
import { mean } from "./manila-model.ts";
export type WeatherContext = {
  version: 2;
  historical_only: true;
  attempted_at: string;
  status: "available-context-only" | "unavailable";
  weather_as_of: string | null;
  rainfall_mm: number | null;
  temperature_c: number | null;
  message: string;
  dengue_as_of: "2023-12-02";
  model: "naive";
  source: string;
};
export async function dailyWeatherContext(
  previous: WeatherContext | null,
  now: Date,
  provider: () => Promise<
    { week_ending: string; rainfall_mm: number; temperature_c: number }[]
  >,
): Promise<WeatherContext> {
  const age = previous
    ? now.getTime() - Date.parse(previous.attempted_at)
    : Infinity;
  if (previous && age >= 0 && age < 86400000) return previous;
  const base = {
    version: 2 as const,
    historical_only: true as const,
    attempted_at: now.toISOString(),
    weather_as_of: null,
    rainfall_mm: null,
    temperature_c: null,
    dengue_as_of: "2023-12-02" as const,
    model: "naive" as const,
    source:
      "ERA5 / Open-Meteo; one Manila point; past completed civil weeks only",
  };
  try {
    const rows = await provider(),
      cutoff = now.getTime() - 7 * 86400000;
    const eligible = rows
      .filter(
        (r) =>
          Date.parse(r.week_ending + "T23:59:59+08:00") <= cutoff &&
          [r.rainfall_mm, r.temperature_c].every(Number.isFinite),
      )
      .sort((a, b) => a.week_ending.localeCompare(b.week_ending));
    const last = eligible.at(-1);
    if (!last) throw Error("No completed delayed weather week");
    return {
      ...base,
      status: "available-context-only",
      weather_as_of: last.week_ending,
      rainfall_mm: last.rainfall_mm,
      temperature_c: mean([last.temperature_c]),
      message:
        "Weather is seasonal context only; showing baseline forecast. Dengue observations remain historical.",
    };
  } catch {
    return {
      ...base,
      status: "unavailable",
      message: weatherFallback("naive", null, false).message,
    };
  }
}
