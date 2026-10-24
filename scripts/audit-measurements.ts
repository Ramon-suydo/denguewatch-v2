import { readFile, writeFile } from "node:fs/promises";
import { parse } from "csv-parse/sync";
import { calendarCorrelation } from "./lib/measurements.ts";
import { sourceDate } from "./lib/historical.ts";
import { advance, mean } from "./lib/manila-model.ts";
import type { ManilaWeek } from "./lib/manila-data.ts";
const manila = JSON.parse(
  await readFile("data/processed/manila_weekly.json", "utf8"),
);
const source = (
  parse(await readFile("data/raw/doh-epi-dengue-data-2016-2021.csv"), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[]
).slice(1);
const dates = source.map((r) => sourceDate(r.date)).sort(),
  keys = new Set<string>();
let duplicates = 0;
for (const row of source) {
  const key = row.loc + "|" + row.date;
  if (keys.has(key)) duplicates++;
  keys.add(key);
}
const ncr = source.filter((r) => r.Region === "NATIONAL CAPITAL REGION");
const yearly = [...new Set(ncr.map((r) => sourceDate(r.date).slice(0, 4)))]
  .sort()
  .map((year) => {
    const rows = ncr.filter((r) => sourceDate(r.date).startsWith(year));
    return {
      year,
      rows: rows.length,
      cases: rows.reduce((s, r) => s + Number(r.cases), 0),
      known_deaths: rows.reduce(
        (s, r) => s + (r.deaths === "" ? 0 : Number(r.deaths)),
        0,
      ),
      missing_death_rows: rows.filter((r) => r.deaths === "").length,
    };
  });
const correlations = [],
  baselines = [];
for (const scenario of ["Z", "M"]) {
  const rows = (manila.scenarios[scenario] as ManilaWeek[]).filter(
    (r) => r.source.startsWith("Daily_") && r.cases !== null,
  );
  const series = new Map(rows.map((r) => [r.week_ending, r.cases!]));
  for (const lag of [1, 2, 4, 8, 52])
    correlations.push({ scenario, lag, ...calendarCorrelation(series, lag) });
  for (const model of ["naive", "mean-4", "seasonal-naive"]) {
    const sample = rows
      .filter((r) => r.week_ending.startsWith("2023"))
      .flatMap((row) => {
        const origin = advance(row.week_ending, -1),
          input =
            model === "seasonal-naive"
              ? [series.get(advance(row.week_ending, -52))]
              : model === "naive"
                ? [series.get(origin)]
                : [0, 1, 2, 3].map((lag) => series.get(advance(origin, -lag)));
        return input.some((v) => v === undefined)
          ? []
          : [{ actual: row.cases!, predicted: mean(input as number[])! }];
      });
    baselines.push({
      scenario,
      model,
      n: sample.length,
      mae: mean(sample.map((r) => Math.abs(r.actual - r.predicted))),
      mean_target_cases: mean(sample.map((r) => r.actual)),
    });
  }
}
const report = {
  national: {
    rows: source.length,
    first: dates[0],
    last: dates.at(-1),
    duplicate_loc_date_rows: duplicates,
    blank_cases: source.filter((r) => r.cases === "").length,
    blank_deaths: source.filter((r) => r.deaths === "").length,
    invalid_case_values: source.filter((r) => !/^\d+$/.test(r.cases)).length,
    invalid_nonblank_death_values: source.filter(
      (r) => r.deaths !== "" && !/^\d+$/.test(r.deaths),
    ).length,
  },
  ncr_yearly: yearly,
  autocorrelations: correlations,
  baselines_2023: baselines,
  definitions:
    "Daily-derived 2018–2023 full-boundary weeks. Exact calendar lags, no gap compression. Z fills internal absent dates only; M requires seven daily rows for targets and all required lag weeks. Each audit baseline uses its own available support, unlike the full paired harness. 2023 ends at last complete-boundary source week; final partial week excluded. Blend not reverified because weights were not specified.",
};
await writeFile(
  "data/processed/measurements.json",
  JSON.stringify(report, null, 2) + "\n",
);
const fmt = (v: number | null) => (v === null ? "Unavailable" : v.toFixed(4));
await writeFile(
  "docs/MEASUREMENTS.md",
  "# Reverified supplied measurements\n\n" +
    report.definitions +
    "\n\n## National file\n\n" +
    JSON.stringify(report.national, null, 2) +
    "\n\n## NCR yearly totals (source values, not validated mortality)\n\n|Year|Rows|Cases|Known deaths|Missing death rows|\n|---|---:|---:|---:|---:|\n" +
    yearly
      .map(
        (r) =>
          `|${r.year}|${r.rows}|${r.cases}|${r.known_deaths}|${r.missing_death_rows}|`,
      )
      .join("\n") +
    "\n\n## Calendar-lag autocorrelation\n\n|Scenario|Lag weeks|Pairs|Pearson r|\n|---|---:|---:|---:|\n" +
    correlations
      .map((r) => `|${r.scenario}|${r.lag}|${r.n}|${fmt(r.r)}|`)
      .join("\n") +
    "\n\n## 2023 baseline audit (separate support per method)\n\n|Scenario|Model|N|MAE|Mean target cases|\n|---|---|---:|---:|---:|\n" +
    baselines
      .map(
        (r) =>
          `|${r.scenario}|${r.model}|${r.n}|${fmt(r.mae)}|${fmt(r.mean_target_cases)}|`,
      )
      .join("\n") +
    "\n\nThe supplied approximate lag correlations depend on missing-day/support conventions. Use the exact calendar-aware values above. Do not compare separate-support errors as paired skill; EVALUATION.md contains matched comparisons, uncertainty and both scenarios. The unspecified blend is not presented as verified.\n",
);
console.log(
  JSON.stringify(
    { national: report.national, baselines, correlations },
    null,
    2,
  ),
);
