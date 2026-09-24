import { createHash } from "node:crypto";
import { computeForecast } from "../../src/lib/forecast.ts";
import type { City, Observation } from "../../src/lib/types.ts";
import type { Database } from "./import-database.ts";
export async function refreshForecasts(db: Database, today?: string) {
  const cities = (
    await db.query(
      "select id,name from public.lgus where is_active order by name",
    )
  ).rows as unknown as City[];
  const rows = (
    await db.query(
      "select id,lgu_id,period_start::text,period_type,cases,source,source_citation,incidence_per_100k::float8,population,population_year,weeks_reported,quality_flags from public.historical_surveillance where period_type='month' order by lgu_id,period_start,id",
    )
  ).rows as unknown as Observation[];
  const summaries = [];
  for (const city of cities) {
    const data = rows.filter((row) => row.lgu_id === city.id);
    const forecast = computeForecast(city.id, data, today);
    const input_digest = createHash("sha256")
      .update(JSON.stringify(data))
      .digest("hex");
    const payload = { ...forecast, input_digest };
    const fields = Object.keys(payload);
    await db.query(
      `insert into public.city_forecasts (${fields.join(",")}) values (${fields.map((_, index) => "$" + (index + 1)).join(",")})
      on conflict(lgu_id) do update set ${fields
        .filter((field) => field !== "lgu_id")
        .map((field) => field + "=excluded." + field)
        .join(",")},computed_at=now()`,
      Object.entries(payload).map(([key, value]) =>
        key === "input_periods" ? JSON.stringify(value) : value,
      ),
    );
    summaries.push({
      city: city.name,
      months: forecast.baseline_count,
      as_of: forecast.data_as_of,
      forecast_for: forecast.forecast_for,
      estimate: forecast.predicted_cases?.toFixed(1),
      historical_signal: forecast.risk_label,
    });
  }
  return summaries;
}
