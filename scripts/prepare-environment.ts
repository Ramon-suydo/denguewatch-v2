import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import {
  aggregateDaily,
  hourlyManila,
  crossSource,
  chooseLags,
  type EnvironmentWeek,
} from "./lib/environment.ts";
import { mean } from "./lib/manila-model.ts";
import type { ManilaWeek } from "./lib/manila-data.ts";
const days = [];
for (let year = 2015; year <= 2023; year++) {
  const path = `data/external/era5-manila-${year}.json`,
    bytes = await readFile(path, "utf8"),
    receipt = JSON.parse(await readFile(path + ".provenance.json", "utf8"));
  assert.equal(
    createHash("sha256").update(bytes).digest("hex"),
    receipt.sha256,
    "ERA5 cache integrity failed",
  );
  days.push(...hourlyManila(JSON.parse(bytes)));
}
const weeks = aggregateDaily(days),
  weather = new Map<string, EnvironmentWeek>(
    weeks.map((r) => [r.week_ending, r]),
  );
const nasa = JSON.parse(
  await readFile("data/processed/power_daily.json", "utf8"),
);
const powerBytes = await readFile(
  "data/external/power-manila-2015-2023.json",
  "utf8",
);
assert.equal(
  createHash("sha256").update(powerBytes).digest("hex"),
  nasa.provenance.sha256,
  "POWER cache integrity failed",
);
const rawPower = JSON.parse(powerBytes);
assert.equal(rawPower.header.time_standard, "LST");
for (const row of nasa.rows) {
  const date = row.date.replaceAll("-", "");
  assert.equal(
    row.rainfall_mm,
    rawPower.properties.parameter.PRECTOTCORR[date],
  );
  assert.equal(row.temperature_c, rawPower.properties.parameter.T2M[date]);
  assert.equal(row.humidity_percent, rawPower.properties.parameter.RH2M[date]);
}
const comparison = crossSource(weeks, aggregateDaily(nasa.rows));
const manila = JSON.parse(
  await readFile("data/processed/manila_weekly.json", "utf8"),
);
const lags: Record<string, unknown> = {},
  profile = [];
for (const scenario of ["Z", "M"]) {
  const rows = manila.scenarios[scenario] as ManilaWeek[],
    series = new Map(
      rows
        .filter((r) => r.cases !== null)
        .map((r) => [r.week_ending, r.cases!]),
    );
  lags[scenario] = chooseLags(series, weather);
  for (let month = 1; month <= 12; month++) {
    const observed = rows.filter(
      (r) => r.cases !== null && Number(r.week_ending.slice(5, 7)) === month,
    );
    const complete = observed.filter(
      (r) =>
        r.reliable && (r.days_with_rows === null || r.days_with_rows === 7),
    );
    profile.push({
      scenario,
      month,
      n: observed.length,
      mean_cases: mean(observed.map((r) => r.cases!)),
      complete_n: complete.length,
      complete_mean_cases: mean(complete.map((r) => r.cases!)),
    });
  }
}
await writeFile(
  "data/processed/environment_weekly.json",
  JSON.stringify({
    source: "ERA5 via Open-Meteo; one Manila point; no station gauges",
    timezone: "Asia/Manila",
    availability:
      "Seven-day minimum delay; all features use weeks ending <= origin minus one week. Retrospective final reanalysis, not operational vintage.",
    rows: weeks,
  }) + "\n",
);
await writeFile(
  "data/processed/environment_design.json",
  JSON.stringify(
    {
      lags,
      comparison,
      profile,
      selection_rule:
        "Maximum absolute log-case Pearson association in 2016-2017 training only, tie earliest; rainfall windows 1/2/4/8 selected there too. No test years consulted. Associations are confounded by season, not causal.",
    },
    null,
    2,
  ) + "\n",
);
console.log(
  JSON.stringify(
    {
      weeks: weeks.length,
      comparison,
      lags: Object.fromEntries(
        Object.entries(lags).map(([k, v]) => [
          k,
          {
            ...(v as object),
            correlations: undefined,
            window_correlations: undefined,
          },
        ]),
      ),
    },
    null,
    2,
  ),
);
