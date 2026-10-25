import assert from "node:assert/strict";
import { weekEnd } from "./manila-data.ts";
import {
  advance,
  mean,
  ridge,
  type Series,
  type Weather,
} from "./manila-model.ts";
export type EnvironmentWeek = Weather & {
  temperature_min_c: number;
  temperature_max_c: number;
  rain_days: number;
  days: number;
};
export type DailyWeather = {
  date: string;
  rainfall_mm: number;
  temperature_c: number;
  humidity_percent: number;
  temperature_min_c?: number;
  temperature_max_c?: number;
};
export function aggregateDaily(rows: DailyWeather[]): EnvironmentWeek[] {
  const days = new Set<string>(),
    weeks = new Map<string, DailyWeather[]>();
  for (const row of rows) {
    assert.match(row.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(
      new Date(row.date + "T00:00:00Z").toISOString().slice(0, 10),
      row.date,
    );
    assert.ok(!days.has(row.date), "Duplicate weather date");
    days.add(row.date);
    assert.ok(
      [row.rainfall_mm, row.temperature_c, row.humidity_percent].every(
        Number.isFinite,
      ),
      "Missing weather value",
    );
    assert.ok(
      row.rainfall_mm >= 0 &&
        row.temperature_c >= -40 &&
        row.temperature_c <= 60 &&
        row.humidity_percent >= 0 &&
        row.humidity_percent <= 100,
      "Invalid weather value",
    );
    const end = weekEnd(row.date);
    weeks.set(end, [...(weeks.get(end) ?? []), row]);
  }
  return [...weeks]
    .filter(([, v]) => v.length === 7)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([end, days]) => ({
      week_ending: end,
      days: 7,
      rainfall_mm: days.reduce((s, r) => s + r.rainfall_mm, 0),
      temperature_c: mean(days.map((r) => r.temperature_c))!,
      humidity_percent: mean(days.map((r) => r.humidity_percent))!,
      temperature_min_c: Math.min(
        ...days.map((r) => r.temperature_min_c ?? r.temperature_c),
      ),
      temperature_max_c: Math.max(
        ...days.map((r) => r.temperature_max_c ?? r.temperature_c),
      ),
      rain_days: days.filter((r) => r.rainfall_mm >= 1).length,
    }));
}
export function hourlyManila(data: any): DailyWeather[] {
  assert.equal(data.timezone, "Asia/Manila");
  assert.equal(data.utc_offset_seconds, 28800);
  assert.equal(data.hourly_units.precipitation, "mm");
  assert.equal(data.hourly_units.temperature_2m, "\u00b0C");
  assert.equal(data.hourly_units.relative_humidity_2m, "%");
  const daily = new Map<
    string,
    { time: string; t: number; p: number; h: number }[]
  >();
  let previous = "";
  for (let i = 0; i < data.hourly.time.length; i++) {
    const time = data.hourly.time[i];
    assert.match(time, /^\d{4}-\d{2}-\d{2}T\d{2}:00$/);
    if (previous)
      assert.equal(
        Date.parse(time + "+08:00") - Date.parse(previous + "+08:00"),
        3600000,
        "Missing or duplicate civil hour",
      );
    previous = time;
    const key = time.slice(0, 10),
      r = {
        time,
        t: data.hourly.temperature_2m[i],
        p: data.hourly.precipitation[i],
        h: data.hourly.relative_humidity_2m[i],
      };
    assert.ok(
      [r.t, r.p, r.h].every((v) => v !== null && Number.isFinite(v)),
      "Missing hourly weather",
    );
    daily.set(key, [...(daily.get(key) ?? []), r]);
  }
  return [...daily].map(([date, hours]) => {
    assert.equal(hours.length, 24);
    return {
      date,
      rainfall_mm: hours.reduce((s, r) => s + r.p, 0),
      temperature_c: mean(hours.map((r) => r.t))!,
      humidity_percent: mean(hours.map((r) => r.h))!,
      temperature_min_c: Math.min(...hours.map((r) => r.t)),
      temperature_max_c: Math.max(...hours.map((r) => r.t)),
    };
  });
}
export function correlation(a: number[], b: number[]) {
  if (a.length !== b.length || a.length < 3) return null;
  const am = mean(a)!,
    bm = mean(b)!,
    aa = a.map((v) => v - am),
    bb = b.map((v) => v - bm),
    den = Math.sqrt(
      aa.reduce((s, v) => s + v * v, 0) * bb.reduce((s, v) => s + v * v, 0),
    );
  return den ? aa.reduce((s, v, i) => s + v * bb[i], 0) / den : null;
}
export function crossSource(a: EnvironmentWeek[], b: EnvironmentWeek[]) {
  const bm = new Map(b.map((r) => [r.week_ending, r]));
  const pairs = a.flatMap((r) =>
    bm.has(r.week_ending) ? [[r, bm.get(r.week_ending)!]] : [],
  );
  return {
    n: pairs.length,
    time_caveat:
      "ERA5 Asia/Manila civil days versus NASA POWER LST solar-swath days; weekly boundaries may differ.",
    rainfall_r: correlation(
      pairs.map((r) => r[0].rainfall_mm),
      pairs.map((r) => r[1].rainfall_mm),
    ),
    temperature_r: correlation(
      pairs.map((r) => r[0].temperature_c),
      pairs.map((r) => r[1].temperature_c),
    ),
    rainfall_mae_mm: mean(
      pairs.map((r) => Math.abs(r[0].rainfall_mm - r[1].rainfall_mm)),
    ),
    temperature_mae_c: mean(
      pairs.map((r) => Math.abs(r[0].temperature_c - r[1].temperature_c)),
    ),
  };
}
export type LagSelection = {
  cutoff: string;
  rain: number;
  temperature: number;
  humidity: number;
  rain_window: number;
  correlations: { driver: string; lag: number; n: number; r: number | null }[];
  window_correlations: { window: number; n: number; r: number | null }[];
};
function windowRain(
  weather: Map<string, EnvironmentWeek>,
  origin: string,
  window: number,
): number | null {
  const values = Array.from(
    { length: window },
    (_, i) => weather.get(advance(origin, -1 - i))?.rainfall_mm,
  );
  return values.some((v) => v === undefined)
    ? null
    : values.reduce<number>((s, v) => s + v!, 0);
}
export function chooseLags(
  series: Series,
  weather: Map<string, EnvironmentWeek>,
  cutoff = "2017-12-31",
): LagSelection {
  const correlations: LagSelection["correlations"] = [];
  const drivers = ["rainfall_mm", "temperature_c", "humidity_percent"] as const;
  for (const driver of drivers)
    for (let lag = 1; lag <= 8; lag++) {
      const pairs = [...series]
        .filter(([d]) => d <= cutoff)
        .flatMap(([target, y]) => {
          const row = weather.get(advance(target, -1 - lag));
          return row
            ? [
                [
                  driver === "rainfall_mm"
                    ? Math.log1p(row[driver])
                    : row[driver],
                  Math.log1p(y),
                ],
              ]
            : [];
        });
      correlations.push({
        driver,
        lag,
        n: pairs.length,
        r: correlation(
          pairs.map((r) => r[0]),
          pairs.map((r) => r[1]),
        ),
      });
    }
  const best = (driver: string) =>
    [
      ...correlations.filter(
        (r) => r.driver === driver && r.n >= 32 && r.r !== null,
      ),
    ].sort((a, b) => Math.abs(b.r!) - Math.abs(a.r!) || a.lag - b.lag)[0]
      ?.lag ?? 1;
  const window_correlations = [1, 2, 4, 8].map((window) => {
    const pairs = [...series]
      .filter(([d]) => d <= cutoff)
      .flatMap(([target, y]) => {
        const rain = windowRain(weather, advance(target, -1), window);
        return rain === null ? [] : [[Math.log1p(rain), Math.log1p(y)]];
      });
    return {
      window,
      n: pairs.length,
      r: correlation(
        pairs.map((p) => p[0]),
        pairs.map((p) => p[1]),
      ),
    };
  });
  const rain_window =
    [...window_correlations]
      .filter((r) => r.n >= 32 && r.r !== null)
      .sort((a, b) => Math.abs(b.r!) - Math.abs(a.r!) || a.window - b.window)[0]
      ?.window ?? 1;
  return {
    cutoff,
    rain: best("rainfall_mm"),
    temperature: best("temperature_c"),
    humidity: best("humidity_percent"),
    rain_window,
    correlations,
    window_correlations,
  };
}
export const ENV_MODELS = [
  "naive",
  "env-ar",
  "env-season",
  "env-weather",
  "env-season-weather",
  "env-season-weather-no-engineered",
] as const;
export type EnvironmentModel = (typeof ENV_MODELS)[number];
export function environmentFeatures(
  series: Series,
  weather: Map<string, EnvironmentWeek>,
  origin: string,
  h: number,
  model: EnvironmentModel,
  selection: LagSelection,
) {
  const cases = [series.get(origin), series.get(advance(origin, -1))];
  if (cases.some((v) => v === undefined)) return null;
  const target = advance(origin, h),
    month = Number(target.slice(5, 7)),
    phase =
      (2 *
        Math.PI *
        (Date.parse(target) - Date.UTC(Number(target.slice(0, 4)), 0, 1))) /
      86400000 /
      365.2425;
  const names = ["log_cases_0", "log_cases_1", "covid_2020_2021"],
    values = [
      ...cases.map((v) => Math.log1p(v!)),
      Number(["2020", "2021"].includes(target.slice(0, 4))),
    ];
  if (model.includes("season")) {
    names.push("rainy_Jun_Nov", "annual_sin", "annual_cos");
    values.push(
      Number(month >= 6 && month <= 11),
      Math.sin(phase),
      Math.cos(phase),
    );
  }
  if (model.includes("weather")) {
    const r = weather.get(advance(origin, -selection.rain)),
      t = weather.get(advance(origin, -selection.temperature)),
      humi = weather.get(advance(origin, -selection.humidity)),
      last = weather.get(advance(origin, -1));
    if (!r || !t || !humi || !last) return null;
    names.push(
      `rain_lag_${selection.rain}`,
      `temperature_lag_${selection.temperature}`,
      `humidity_lag_${selection.humidity}`,
    );
    values.push(
      Math.log1p(r.rainfall_mm),
      t.temperature_c,
      humi.humidity_percent,
    );
    if (!model.includes("no-engineered")) {
      const rolling = windowRain(weather, origin, selection.rain_window);
      if (rolling === null) return null;
      names.push(
        `rain_rolling_${selection.rain_window}`,
        "rain_days_lag_1",
        "temperature_min_lag_1",
        "temperature_max_lag_1",
      );
      values.push(
        Math.log1p(rolling),
        last.rain_days,
        last.temperature_min_c,
        last.temperature_max_c,
      );
      if (model.includes("season")) {
        // A research index, not a PAGASA meteorological onset declaration. Missing
        // preceding weeks makes the feature unavailable, never silently zero-filled.
        const jan = origin.slice(0, 4) + "-01-01";
        let cumulative = 0,
          onset: string | null = null;
        for (
          let date = weekEnd(jan);
          date <= advance(origin, -1);
          date = advance(date, 1)
        ) {
          if (
            advance(date, -1) < jan &&
            Date.parse(date) - Date.parse(jan) < 6 * 86400000
          )
            continue;
          const row = weather.get(date);
          if (!row) return null;
          cumulative += row.rainfall_mm;
          if (onset === null && cumulative >= 200) onset = date;
        }
        names.push("rain_200mm_reached", "weeks_since_200mm_capped_26");
        values.push(
          Number(onset !== null),
          onset
            ? Math.min(
                26,
                (Date.parse(advance(origin, -1)) - Date.parse(onset)) /
                  604800000,
              )
            : 0,
        );
      }
    }
  }
  return { names, values };
}
export function environmentFit(
  series: Series,
  weather: Map<string, EnvironmentWeek>,
  origin: string,
  h: number,
  model: EnvironmentModel,
  selection: LagSelection,
) {
  const past = new Map([...series].filter(([d]) => d <= origin));
  const current = past.get(origin);
  if (current === undefined) return null;
  if (model === "naive")
    return { predicted: current, trainN: past.size, trainEnd: origin };
  const x = environmentFeatures(past, weather, origin, h, model, selection);
  if (!x) return null;
  const train = [...past]
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([date, y]) => {
      const f = environmentFeatures(
        past,
        weather,
        advance(date, -h),
        h,
        model,
        selection,
      );
      return f ? [{ date, x: f.values, y: Math.log1p(y) }] : [];
    });
  if (train.length < 32) return null;
  return {
    ...ridge(train, x.values),
    names: x.names,
    trainN: train.length,
    trainEnd: train.at(-1)!.date,
  };
}
export { weatherFallback } from "../../src/lib/forecast-policy.ts";
