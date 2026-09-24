import { test } from "node:test";
import assert from "node:assert/strict";
import {
  completeMonth,
  computeForecast,
  currentRisk,
  historicalOnly,
  MONTHLY_SOURCE,
  quantile,
} from "../src/lib/forecast.ts";
import { manilaToday, nextMonth, recentMonday } from "../src/lib/dates.ts";
import type { Forecast, Observation } from "../src/lib/types.ts";
function observations(count = 36): Observation[] {
  let date = "2017-01-01";
  return Array.from({ length: count }, (_, index) => {
    const next = nextMonth(date);
    let sundays = 0;
    for (
      const day = new Date(date + "T00:00:00Z");
      day < new Date(next + "T00:00:00Z");
      day.setUTCDate(day.getUTCDate() + 1)
    )
      if (day.getUTCDay() === 0) sundays++;
    const row = {
      id: index,
      lgu_id: "city",
      period_start: date,
      period_type: "month" as const,
      cases: index + 1,
      source: MONTHLY_SOURCE,
      source_citation: "test fixture",
      incidence_per_100k: null,
      population: null,
      population_year: null,
      weeks_reported: sundays,
      quality_flags: [],
    };
    date = next;
    return row;
  });
}
test("WMA and interpolated thresholds use the city distribution, not fixed thresholds", () => {
  const forecast = computeForecast("city", observations(), "2026-09-24");
  assert.equal(forecast.predicted_cases, (34 + 2 * 35 + 3 * 36) / 6);
  assert.equal(forecast.p50, 18.5);
  assert.equal(forecast.p80, 29);
  assert.equal(forecast.risk_label, "High");
  assert.equal(forecast.forecast_for, "2020-01-01");
  assert.equal(quantile([0, 10, 20, 30], 0.5), 15);
  assert.throws(() => quantile([], 0.5));
  const asCached = {
    ...forecast,
    computed_at: "2026-09-24",
    input_digest: "test",
  } as Forecast;
  assert.equal(currentRisk(asCached, "2020-01-20"), "High");
  assert.equal(currentRisk(asCached, "2020-02-01"), "Insufficient data");
  assert.equal(currentRisk(asCached, "2019-12-31"), "Insufficient data");
  assert.equal(historicalOnly(asCached, "2026-09-24"), true);
});
test("partial, suspect, wrong-source, wrong-city and incomplete months cannot enter a forecast", () => {
  const rows = observations();
  rows[35].quality_flags = ["partial_2021_coverage"];
  rows[34].quality_flags = ["aggregate_contains_suspect_weekly_values"];
  rows[33].weeks_reported = 1;
  rows[32].source = "different.csv";
  rows[31].lgu_id = "other";
  const forecast = computeForecast("city", rows, "2026-09-24");
  assert.equal(forecast.baseline_count, 31);
  assert.equal(forecast.data_as_of, rows[30].period_start);
  assert.equal(forecast.input_periods.length, 3);
  assert.equal(completeMonth(rows[0], "2017-01-31"), false);
  assert.equal(completeMonth(rows[0], "2017-02-01"), true);
  const january = observations(1)[0];
  january.weeks_reported = 4;
  assert.equal(completeMonth(january, "2026-09-24"), false); // Five expected Sundays.
});
test("insufficient sample and degenerate distributions never invent risk tiers", () => {
  assert.equal(
    computeForecast("city", observations(23), "2026-09-24").risk_label,
    "Insufficient data",
  );
  const constant = observations().map((row) => ({ ...row, cases: 0 }));
  assert.equal(
    computeForecast("city", constant, "2026-09-24").risk_label,
    "Insufficient data",
  );
  assert.equal(computeForecast("city", []).predicted_cases, null);
});
test("date controls and recent community window use Asia/Manila calendar dates", () => {
  assert.equal(manilaToday(new Date("2026-09-23T17:00:00Z")), "2026-09-24");
  assert.equal(recentMonday(new Date("2026-09-24T03:00:00Z")), "2026-08-03");
  assert.equal(nextMonth("2020-12-01"), "2021-01-01");
});
