import { readFile, writeFile } from "node:fs/promises";
import {
  fitAt,
  thresholdEpisodes,
  type Result,
  type Weather,
} from "./lib/manila-model.ts";
import type { ManilaWeek } from "./lib/manila-data.ts";
const path = "data/processed/evaluation.json",
  data = JSON.parse(await readFile(path, "utf8"));
const manila = JSON.parse(
  await readFile("data/processed/manila_weekly.json", "utf8"),
);
const weatherData = JSON.parse(
  await readFile("data/processed/weather_weekly.json", "utf8"),
);
const weather = new Map<string, Weather>(
  weatherData.rows.map((r: Weather) => [r.week_ending, r]),
);
const evidence = data.evidence as Result[];
const leads = [];
for (const horizonSet of ["primary-1-2", "exploratory-1-2-4"])
  for (const scenario of ["Z", "M"])
    for (const model of [
      "naive",
      "mean-4",
      "seasonal-naive",
      "endemic-channel",
      "ridge-cases",
      "ridge-weather",
      "tree-cases",
      "tree-weather",
    ]) {
      leads.push({
        horizon_set: horizonSet,
        scenario,
        model,
        ...thresholdEpisodes(
          evidence,
          scenario,
          model,
          horizonSet === "primary-1-2" ? [1, 2] : [1, 2, 4],
        ),
      });
    }
const drivers = [];
for (const scenario of ["Z", "M"]) {
  const rows = manila.scenarios[scenario] as ManilaWeek[],
    series = new Map(
      rows
        .filter((r) => r.cases !== null)
        .map((r) => [r.week_ending, r.cases!]),
    ),
    origin = rows
      .filter((r) => r.cases !== null && r.reliable)
      .at(-1)!.week_ending;
  for (const model of [
    "ridge-cases",
    "ridge-weather",
    "tree-cases",
    "tree-weather",
  ] as const) {
    const fit = fitAt(series, weather, origin, 1, model);
    if (fit) {
      const total = fit.coefficients.reduce((s, v) => s + v, 0);
      drivers.push({
        scenario,
        model,
        origin,
        interpretation: model.startsWith("tree")
          ? "Normalized training split gain, descriptive only"
          : "Coefficients on training-standardized features predicting log1p cases, descriptive only",
        rows: fit.names.map((name, i) => ({
          name,
          value: model.startsWith("tree")
            ? total
              ? fit.coefficients[i] / total
              : 0
            : fit.coefficients[i],
        })),
      });
    }
  }
}
data.episode_leads = leads;
data.drivers = drivers;
await writeFile(path, JSON.stringify(data) + "\n");
const marker = "\n## Threshold-episode lead time and driver fits\n";
let doc = await readFile("docs/EVALUATION.md", "utf8");
doc = doc.split(marker)[0];
doc +=
  marker +
  "\nA threshold episode begins only when a scored one-week target is above its past-only threshold and the immediately preceding calendar week is observed at/below threshold. Gaps do not establish episode onset. Lead is the earliest positive forecast targeting that onset among 1/2/4-week horizons. This measures research threshold episodes, not medically confirmed outbreaks. Eligible events, misses and exact origins are saved in evaluation.json.\n\n|Horizon set|Scenario|Model|Eligible onsets|Detected|Mean lead weeks|\n|---|---|---|---:|---:|---:|\n" +
  leads
    .map(
      (r) =>
        `|${r.horizon_set}|${r.scenario}|${r.model}|${r.eligible_onsets}|${r.detected_onsets}|${r.mean_lead_weeks?.toFixed(3) ?? "Unavailable"}|`,
    )
    .join("\n") +
  "\n\nDescriptive final one-week ridge coefficients and normalized boosted-stump split gains are saved by scenario/model with fit origin and feature names. These are training-fit summaries, not causal driver effects or out-of-sample feature attribution. Weather remains excluded from the public baseline.\n";
doc +=
  "\n## Alternate-source sensitivity (case-only)\n\nThese experiments replace 2018–2020 targets/training with DOH. Sample support changes; do not interpret between-experiment MAE differences as paired model skill. They do not test weather robustness under the alternate source.\n\n|Scenario/source|Fold|Horizon|Model|N|MAE|\n|---|---|---:|---|---:|---:|\n" +
  data.summaries
    .filter(
      (r: any) =>
        ["Z", "M", "Z-DOH-sensitivity", "M-DOH-sensitivity"].includes(
          r.scenario,
        ) &&
        ["test-2018-2023", "2023"].includes(r.fold) &&
        [1, 2].includes(r.horizon) &&
        ["naive", "ridge-cases"].includes(r.model),
    )
    .map(
      (r: any) =>
        `|${r.scenario}|${r.fold}|${r.horizon}|${r.model}|${r.n}|${r.mae?.toFixed(3) ?? "Unavailable"}|`,
    )
    .join("\n") +
  "\n";
doc +=
  "\n## Figures\n\n![Historical 2023 actual versus forecast](figures/forecast-vs-actual.png)\n\n![Error by horizon and scenario](figures/error-by-horizon.png)\n\nRecreate with npm run evaluate:plots (Python 3 with matplotlib). Missing targets break the plot line; no zero is inserted.\n";
await writeFile("docs/EVALUATION.md", doc);
console.log(
  JSON.stringify(
    {
      thresholdEpisodeLeads: leads.map(({ events: _events, ...r }) => r),
      descriptiveDriverFits: drivers.length,
    },
    null,
    2,
  ),
);
