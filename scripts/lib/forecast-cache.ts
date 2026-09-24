import { backtest, riskInputs, candidate } from "../../src/lib/composite.ts";
import { manilaToday } from "../../src/lib/dates.ts";
import { createHash } from "node:crypto";
import { computeForecast } from "../../src/lib/forecast.ts";
import type { City, CommunityWeek, Observation } from "../../src/lib/types.ts";
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
  const community = (
    await db.query(
      "select lgu_id,week_start::text,report_count::integer from public.community_reports_weekly_agg()",
    )
  ).rows as unknown as CommunityWeek[];
  const evaluation = backtest(rows);
  for (const row of evaluation.predictions) {
    for (const model of ["baseline", "composite"] as const)
      await db.query(
        "insert into public.historical_forecast_backtest(lgu_id,method_version,test_period_start,period_type,source,predicted_cases,actual_cases) values($1,$2,$3,'month',$4,$5,$6) on conflict(lgu_id,method_version,test_period_start,period_type,source) do update set predicted_cases=excluded.predicted_cases,actual_cases=excluded.actual_cases,computed_at=now()",
        [
          row.city,
          model === "baseline" ? "paired-wma-v1" : "paired-seasonal-75-25-v1",
          row.target,
          "ncr_dengue_monthly_with_rates.csv",
          row[model],
          row.actual,
        ],
      );
  }
  const summaries = [];
  for (const city of cities) {
    const data = rows.filter((row) => row.lgu_id === city.id);
    const forecast = computeForecast(city.id, data, today);
    const inputs = riskInputs(
      data,
      today ?? manilaToday(),
      evaluation.selected,
      community.filter((w) => w.lgu_id === city.id),
    );
    if (evaluation.selected && forecast.predicted_cases !== null) {
      forecast.predicted_cases = candidate(
        forecast.predicted_cases,
        inputs.seasonality.ratio,
      );
      if (
        forecast.p50 !== null &&
        forecast.p80 !== null &&
        forecast.p80 > forecast.p50
      )
        forecast.risk_label =
          forecast.predicted_cases <= forecast.p50
            ? "Low"
            : forecast.predicted_cases <= forecast.p80
              ? "Medium"
              : "High";
      forecast.method_version = "monthly-seasonal-75-25-v1";
    }
    await db.query(
      "insert into public.barangay_risk(lgu_id,inputs) values($1,$2) on conflict(lgu_id) do update set inputs=excluded.inputs,computed_at=now()",
      [
        city.id,
        JSON.stringify({
          ...inputs,
          selection: {
            selected: evaluation.selected,
            development: evaluation.development,
            holdout: evaluation.holdout,
          },
        }),
      ],
    );
    const input_digest = createHash("sha256")
      .update(JSON.stringify({ data, inputs, method: forecast.method_version }))
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
