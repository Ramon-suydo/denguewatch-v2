import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  aggregateDaily,
  hourlyManila,
  chooseLags,
  crossSource,
  environmentFeatures,
  environmentFit,
  weatherFallback,
  type EnvironmentWeek,
  type DailyWeather,
} from "../scripts/lib/environment.ts";
import { advance } from "../scripts/lib/manila-model.ts";
import { dailyWeatherContext } from "../scripts/lib/weather-context.ts";
import { cachedRequest } from "../scripts/lib/source-cache.ts";
import { seasonalContext } from "../src/lib/environment.ts";
function fixture() {
  const series = new Map<string, number>(),
    weather = new Map<string, EnvironmentWeek>();
  for (let k = 0; k < 180; k++) {
    const week_ending = advance("2015-01-04", k);
    series.set(week_ending, 20 + (k % 23) * 2);
    weather.set(week_ending, {
      week_ending,
      days: 7,
      rainfall_mm: k % 11,
      temperature_c: 26 + (k % 4),
      humidity_percent: 60 + (k % 20),
      rain_days: k % 7,
      temperature_min_c: 23,
      temperature_max_c: 32,
    });
  }
  return { series, weather };
}
test("civil Manila hours align Monday-Sunday without shifting to UTC day", () => {
  const times = Array.from({ length: 168 }, (_, i) =>
    new Date(Date.UTC(2023, 0, 2) + i * 3600000).toISOString().slice(0, 16),
  );
  const raw = {
    timezone: "Asia/Manila",
    utc_offset_seconds: 28800,
    hourly_units: {
      precipitation: "mm",
      temperature_2m: "\u00b0C",
      relative_humidity_2m: "%",
    },
    hourly: {
      time: times,
      precipitation: times.map(() => 1),
      temperature_2m: times.map(() => 28),
      relative_humidity_2m: times.map(() => 75),
    },
  };
  const daily = hourlyManila(raw);
  assert.equal(daily[0].date, "2023-01-02");
  assert.equal(daily[6].date, "2023-01-08");
  const [week] = aggregateDaily(daily);
  assert.equal(week.week_ending, "2023-01-08");
  assert.equal(week.rainfall_mm, 168);
  assert.equal(week.rain_days, 7);
  assert.equal(week.temperature_c, 28);
  assert.throws(() => hourlyManila({ ...raw, timezone: "UTC" }));
  const broken = structuredClone(raw);
  broken.hourly.time[1] = broken.hourly.time[0];
  assert.throws(() => hourlyManila(broken), /Missing or duplicate/);
  assert.equal(aggregateDaily(daily.slice(1)).length, 0);
  assert.throws(() => aggregateDaily([...daily, daily[0]]), /Duplicate/);
});
test("frozen lag selection ignores test-year cases and weather", () => {
  const { series, weather } = fixture(),
    frozen = chooseLags(series, weather);
  for (const [date, value] of series)
    if (date > "2017-12-31") series.set(date, value * 10000);
  for (const [date, row] of weather)
    if (date > "2017-12-31")
      weather.set(date, { ...row, rainfall_mm: 9999, temperature_c: -10 });
  assert.deepEqual(chooseLags(series, weather), frozen);
  assert.equal(frozen.cutoff, "2017-12-31");
  assert.equal(frozen.correlations.length, 24);
});
test("forecast features and training fits never use origin-week or future weather / cases", () => {
  const { series, weather } = fixture(),
    selection = chooseLags(series, weather),
    origin = "2018-04-01";
  const before = environmentFeatures(
      series,
      weather,
      origin,
      2,
      "env-season-weather",
      selection,
    ),
    fit = environmentFit(
      series,
      weather,
      origin,
      2,
      "env-season-weather",
      selection,
    );
  assert.ok(before && fit);
  assert.ok(fit.trainEnd <= origin);
  for (const [date, row] of weather)
    if (date >= origin)
      weather.set(date, {
        ...row,
        rainfall_mm: 9999,
        temperature_c: -10,
        humidity_percent: 1,
      });
  for (const [date, value] of series)
    if (date > origin) series.set(date, value * 1000);
  assert.deepEqual(
    environmentFeatures(
      series,
      weather,
      origin,
      2,
      "env-season-weather",
      selection,
    ),
    before,
  );
  assert.deepEqual(
    environmentFit(series, weather, origin, 2, "env-season-weather", selection),
    fit,
  );
  weather.delete(advance(origin, -selection.rain));
  assert.equal(
    environmentFeatures(series, weather, origin, 2, "env-weather", selection),
    null,
  );
});
test("cross-source comparison pairs dates, reports disagreement and never fills absent weeks", () => {
  const days: DailyWeather[] = Array.from({ length: 28 }, (_, i) => ({
    date: new Date(Date.UTC(2023, 0, 2) + i * 86400000)
      .toISOString()
      .slice(0, 10),
    rainfall_mm: 1 + Math.floor(i / 7),
    temperature_c: 22 + Math.floor(i / 7),
    humidity_percent: 70,
  }));
  const a = aggregateDaily(days),
    b = a
      .slice(1)
      .map((r) => ({
        ...r,
        rainfall_mm: r.rainfall_mm * 2,
        temperature_c: r.temperature_c + 2,
      }));
  const c = crossSource(a, b);
  assert.equal(c.n, 3);
  assert.ok(Math.abs(c.rainfall_r! - 1) < 1e-12);
  assert.equal(c.temperature_mae_c, 2);
  assert.ok(c.rainfall_mae_mm! > 0);
  assert.throws(() => aggregateDaily([{ ...days[0], rainfall_mm: -999 }]));
});
test("public forecast remains persistence when environmental input is absent or rejected", () => {
  const baseline = { predicted: 62, low80: 40, high80: 84 };
  const selected = weatherFallback(
    baseline,
    { predicted: 100, low80: 0, high80: 200 },
    false,
  );
  assert.equal(selected.forecast, baseline);
  assert.equal(selected.model, "naive");
  assert.match(selected.message, /Weather data unavailable/);
  assert.equal(weatherFallback(baseline, null, true).forecast, baseline);
  assert.equal(
    weatherFallback(baseline, { predicted: 100, low80: 0, high80: 200 }, true)
      .forecast,
    baseline,
  );
});
test("daily server refresh caches failures too and only accepts delayed complete weeks", async () => {
  let calls = 0;
  const now = new Date("2026-10-25T12:00:00Z"),
    fail = async () => {
      calls++;
      throw Error("source outage");
    };
  const unavailable = await dailyWeatherContext(null, now, fail);
  assert.equal(unavailable.status, "unavailable");
  assert.match(unavailable.message, /Weather data unavailable/);
  assert.equal(unavailable.model, "naive");
  assert.deepEqual(
    await dailyWeatherContext(
      unavailable,
      new Date("2026-10-26T11:59:59Z"),
      fail,
    ),
    unavailable,
  );
  assert.equal(calls, 1);
  await dailyWeatherContext(
    unavailable,
    new Date("2026-10-26T12:00:00Z"),
    fail,
  );
  assert.equal(calls, 2);
  const available = await dailyWeatherContext(null, now, async () => [
    { week_ending: "2026-10-11", rainfall_mm: 10, temperature_c: 28 },
    { week_ending: "2026-10-25", rainfall_mm: 999, temperature_c: 30 },
  ]);
  assert.equal(available.weather_as_of, "2026-10-11");
  assert.equal(available.rainfall_mm, 10);
  assert.equal(available.dengue_as_of, "2023-12-02");
});
test("cache fetches cannot target arbitrary services and offline misses give exact destination", async () => {
  await assert.rejects(
    cachedRequest(
      "data/external/no-test-file.json",
      "https://example.com/data",
      "x",
      "x",
    ),
    /Unsupported/,
  );
  const old = process.env.ENV_OFFLINE;
  process.env.ENV_OFFLINE = "1";
  try {
    await assert.rejects(
      cachedRequest(
        "data/external/no-test-file.json",
        "https://power.larc.nasa.gov/test",
        "x",
        "x",
      ),
      /Download https:\/\/power.larc.nasa.gov\/test to data\/external\/no-test-file.json/,
    );
  } finally {
    if (old === undefined) delete process.env.ENV_OFFLINE;
    else process.env.ENV_OFFLINE = old;
  }
});
test("PAGASA season context is explicitly non-predictive in both languages", () => {
  assert.match(seasonalContext(6), /June to November/);
  assert.match(seasonalContext(4), /December to May/);
  assert.match(seasonalContext(6), /not a dengue prediction/);
  assert.match(seasonalContext(6, true), /hindi pagtataya/);
});
test("saved environmental evidence is paired, uses training-only lag selection and contains no raw reports", async () => {
  const data = JSON.parse(
    await readFile("data/processed/environment_evaluation.json", "utf8"),
  );
  for (const scenario of ["Z", "M"]) {
    assert.equal(data.design.lags[scenario].cutoff, "2017-12-31");
    for (const h of [1, 2, 4]) {
      const rows = data.summaries.filter(
        (r: any) =>
          r.scenario === scenario &&
          r.horizon === h &&
          r.fold === "test-2018-2023",
      );
      assert.equal(new Set(rows.map((r: any) => r.n)).size, 1);
      assert.equal(rows.length, 6);
    }
  }
  assert.ok(
    data.evidence.every(
      (r: any) => r.trainEnd <= r.origin && r.origin < r.target,
    ),
  );
  assert.equal(data.design.comparison.n, 469);
  assert.equal(data.community_reports, undefined);
});
