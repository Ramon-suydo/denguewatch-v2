import { readFile, writeFile } from "node:fs/promises";
import {
  ENV_MODELS,
  environmentFit,
  type EnvironmentWeek,
  type LagSelection,
} from "./lib/environment.ts";
import {
  advance,
  mean,
  endemic,
  calibrate,
  metrics,
  bootstrapSkill,
  thresholdEpisodes,
  type Result,
} from "./lib/manila-model.ts";
import type { ManilaWeek } from "./lib/manila-data.ts";
const manila = JSON.parse(
  await readFile("data/processed/manila_weekly.json", "utf8"),
);
const design = JSON.parse(
  await readFile("data/processed/environment_design.json", "utf8"),
);
const weather = new Map<string, EnvironmentWeek>(
  JSON.parse(
    await readFile("data/processed/environment_weekly.json", "utf8"),
  ).rows.map((r: EnvironmentWeek) => [r.week_ending, r]),
);
const evidence: Result[] = [],
  exclusions: Record<string, number> = {};
for (const scenario of ["Z", "M"]) {
  const rows = manila.scenarios[scenario] as ManilaWeek[],
    series = new Map(
      rows
        .filter((r) => r.cases !== null)
        .map((r) => [r.week_ending, r.cases!]),
    );
  const selection = design.lags[scenario] as LagSelection,
    histories = new Map<string, Result[]>();
  for (const origin of rows
    .map((r) => r.week_ending)
    .filter((d) => d >= "2018-01-01"))
    for (const horizon of [1, 2, 4]) {
      const target = advance(origin, horizon),
        actual = series.get(target),
        current = series.get(origin);
      if (actual === undefined || current === undefined) continue;
      const fits = ENV_MODELS.map((m) =>
        environmentFit(series, weather, origin, horizon, m, selection),
      );
      if (fits.some((f) => !f || !Number.isFinite(f.predicted))) {
        exclusions[scenario] = (exclusions[scenario] ?? 0) + 1;
        continue;
      }
      const past = new Map([...series].filter(([d]) => d <= origin)),
        threshold = endemic(past, target, origin)?.threshold ?? null;
      const scale = mean(
        [...past].flatMap(([d, y]) =>
          past.has(advance(d, -1))
            ? [Math.abs(y - past.get(advance(d, -1))!)]
            : [],
        ),
      );
      ENV_MODELS.forEach((model, i) => {
        const f = fits[i]!,
          key = model + ":" + horizon,
          previous = histories.get(key) ?? [];
        const row: Result = {
          scenario,
          origin,
          target,
          horizon,
          model,
          actual,
          predicted: f.predicted,
          naive: current,
          threshold,
          scale,
          trainN: f.trainN,
          trainEnd: f.trainEnd,
          ...calibrate(previous, origin, f.predicted, threshold, current),
        };
        evidence.push(row);
        previous.push(row);
        histories.set(key, previous);
      });
    }
  console.log("Environment completed " + scenario);
}
const summaries: ({
  scenario: string;
  horizon: number;
  model: string;
  fold: string;
} & ReturnType<typeof metrics> & {
    skill95: ReturnType<typeof bootstrapSkill>;
  })[] = [];
for (const scenario of ["Z", "M"])
  for (const horizon of [1, 2, 4])
    for (const model of ENV_MODELS)
      for (const fold of [
        "2018",
        "2019",
        "2020",
        "2021",
        "2022",
        "2023",
        "covid-2020-2021",
        "test-2018-2023",
      ]) {
        const rows = evidence.filter(
          (r) =>
            r.scenario === scenario &&
            r.horizon === horizon &&
            r.model === model &&
            (fold === "test-2018-2023" ||
              (fold === "covid-2020-2021"
                ? ["2020", "2021"].includes(r.target.slice(0, 4))
                : r.target.startsWith(fold))),
        );
        if (rows.length)
          summaries.push({
            scenario,
            horizon,
            model,
            fold,
            ...metrics(rows),
            skill95: bootstrapSkill(rows),
          });
      }
const leads = [];
for (const scenario of ["Z", "M"])
  for (const model of ENV_MODELS)
    leads.push({
      scenario,
      model,
      ...thresholdEpisodes(evidence, scenario, model, [1, 2]),
    });
const drivers = [];
for (const scenario of ["Z", "M"]) {
  const series = new Map(
    (manila.scenarios[scenario] as ManilaWeek[])
      .filter((r) => r.cases !== null)
      .map((r) => [r.week_ending, r.cases!]),
  );
  const origin = (manila.scenarios[scenario] as ManilaWeek[])
    .filter((r) => r.cases !== null && r.reliable)
    .at(-1)!.week_ending;
  for (const model of ENV_MODELS.filter((m) => m !== "naive")) {
    const fit = environmentFit(
      series,
      weather,
      origin,
      1,
      model,
      design.lags[scenario],
    );
    if (fit && "names" in fit)
      drivers.push({
        scenario,
        model,
        origin,
        interpretation:
          "Descriptive standardized coefficients in final historical training fit; no causal interpretation or test-year lag selection.",
        rows: fit.names.map((name, i) => ({
          name,
          value: fit.coefficients[i],
        })),
      });
  }
}
const metadata = {
  version: "environment-ablation-v1",
  seed: 20261025,
  lag_cutoff: "2017-12-31",
  models: ENV_MODELS,
  training:
    "AR(2) log1p ridge, fixed L2=20, standardization from each training prefix only; >=32 training pairs. COVID indicator in all AR variants. Lag selection frozen from 2016-2017 only; no 2017 calibration scores reused.",
  paired_support:
    "All six methods share identical origin/target rows within scenario/horizon. M gaps remain missing. Frozen selected lags yield more M pairs than the prior 8-lag main harness: these are different comparison cohorts.",
  features:
    "Season adds June-November flag and sin/cos; weather adds selected rainfall, temperature and humidity lags, selected rainfall window, >=1mm rain days and weekly temperature min/max at lag 1. Combined adds a fixed research cumulative-200mm onset proxy, not PAGASA onset. No-engineered combined variant drops rainfall roll/rain-day/min/max/onset engineering.",
  calibration:
    "Only prior out-of-sample targets matured by each origin. Calibration starts in 2018; first 20 matured rows have unavailable probabilities and intervals.",
  thermal:
    "Optional thermal index omitted: no verified parameter curve is implemented; never labelled tested.",
  operational:
    "No environmental model is promoted. Public persistence baseline remains independent of weather availability. No current dengue observations exist.",
  bootstrap:
    "400 circular moving blocks of 8 observed rows, seed 20261025, 95% skill CI versus matched persistence; gaps mean observed blocks are not necessarily eight calendar weeks.",
};
const bundle = {
  version: 2,
  historical_only: true,
  metadata,
  design,
  summaries,
  leads,
  drivers,
  exclusions,
};
await writeFile(
  "data/processed/environment_evaluation.json",
  JSON.stringify({ ...bundle, evidence }) + "\n",
);
await writeFile(
  "public/api/v2/environment.json",
  JSON.stringify(bundle) + "\n",
);
const fmt = (n: number | null | undefined) =>
  n == null ? "Unavailable" : n.toFixed(3);
const lines = [
  "# Environmental evaluation results",
  "",
  "Regenerate offline from verified caches with `npm run evaluate`.",
  "",
  metadata.training,
  "",
  metadata.paired_support,
  "",
  metadata.calibration,
  "",
  "## Matched 2018-2023 test folds",
  "",
  "|Scenario|Horizon|Model|N|MAE|RMSE|MASE|Skill vs persistence %|95% CI|80% coverage|",
  "|---|---:|---|---:|---:|---:|---:|---:|---|---:|",
];
for (const s of summaries.filter((s) => s.fold === "test-2018-2023"))
  lines.push(
    `|${s.scenario}|${s.horizon}|${s.model}|${s.n}|${fmt(s.mae)}|${fmt(s.rmse)}|${fmt(s.mase)}|${fmt(s.skillPercent)}|${fmt(s.skill95?.low)} to ${fmt(s.skill95?.high)}|${fmt(s.coverage80)}|`,
  );
lines.push(
  "",
  "## Held-out one-week season comparison",
  "",
  "|Scenario|Year|AR MAE|AR + season MAE|Season change % vs AR|Persistence MAE|",
  "|---|---|---:|---:|---:|---:|",
);
for (const scenario of ["Z", "M"])
  for (const fold of ["2018", "2019", "2020", "2021", "2022", "2023"]) {
    const get = (model: string) =>
      summaries.find(
        (s) =>
          s.scenario === scenario &&
          s.horizon === 1 &&
          s.fold === fold &&
          s.model === model,
      )?.mae;
    const ar = get("env-ar"),
      season = get("env-season");
    lines.push(
      `|${scenario}|${fold}|${fmt(ar)}|${fmt(season)}|${ar && season != null ? fmt(100 * (1 - season / ar)) : "Unavailable"}|${fmt(get("naive"))}|`,
    );
  }
lines.push(
  "",
  "## Alerts (primary 1/2 week horizons)",
  "",
  "|Scenario|H|Model|N calibrated|Precision|Recall|F1|AUC|Brier|False positive rate|",
  "|---|---:|---|---:|---:|---:|---:|---:|---:|---:|",
);
for (const s of summaries.filter(
  (s) => s.fold === "test-2018-2023" && s.horizon <= 2,
))
  lines.push(
    `|${s.scenario}|${s.horizon}|${s.model}|${s.alertN}|${fmt(s.precision)}|${fmt(s.recall)}|${fmt(s.f1)}|${fmt(s.rocAuc)}|${fmt(s.brier)}|${fmt(s.falseAlarmRate)}|`,
  );
lines.push(
  "",
  "## Threshold episode lead (same onset, primary horizons only)",
  "",
  "|Scenario|Model|Eligible onsets|Detected|Mean lead weeks|",
  "|---|---|---:|---:|---:|",
);
for (const s of leads)
  lines.push(
    `|${s.scenario}|${s.model}|${s.eligible_onsets}|${s.detected_onsets}|${fmt(s.mean_lead_weeks)}|`,
  );
lines.push(
  "",
  "Eligible onset requires the immediately previous observed calendar week to be below its past-only threshold. Missing prior weeks are not invented. FPR = FP/(FP+TN). False fraction among alerts = 1 - precision.",
  "",
  metadata.features,
  "",
  metadata.thermal,
  "",
  metadata.bootstrap,
  "",
  metadata.operational,
  "",
  "All yearly/COVID folds, interval denominators, lag correlations, coefficients and per-origin records are saved in environment_evaluation.json. Descriptive correlations and coefficients do not establish causation.",
);
await writeFile("docs/ENVIRONMENT_RESULTS.md", lines.join("\n") + "\n");
console.log(
  JSON.stringify(
    summaries
      .filter((s) => s.fold === "test-2018-2023" && s.horizon <= 2)
      .map(({ scenario, horizon, model, n, mae, skill95 }) => ({
        scenario,
        horizon,
        model,
        n,
        mae,
        skill95,
      })),
    null,
    2,
  ),
);
