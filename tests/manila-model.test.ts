import { test } from "node:test";
import assert from "node:assert/strict";
import {
  advance,
  fitAt,
  calibrate,
  endemic,
  metrics,
  bootstrapSkill,
  auc,
  featureVector,
  thresholdEpisodes,
  type Result,
} from "../scripts/lib/manila-model.ts";
const series = new Map(
  Array.from({ length: 180 }, (_, i) => [
    advance("2016-01-03", i),
    10 + (i % 17),
  ]),
);
test("fitters cannot see future targets, scalers, tree splits or weather", () => {
  const origin = advance("2016-01-03", 150),
    future = new Map(series);
  for (const [date] of future) if (date > origin) future.set(date, 1000000);
  for (const model of [
    "naive",
    "mean-4",
    "seasonal-naive",
    "endemic-channel",
    "ridge-cases",
    "tree-cases",
  ] as const) {
    assert.deepEqual(
      fitAt(series, new Map(), origin, 2, model),
      fitAt(future, new Map(), origin, 2, model),
    );
    assert.ok(fitAt(series, new Map(), origin, 2, model)!.trainEnd <= origin);
  }
});
test("exact calendar lags are required and demographics are not features", () => {
  const origin = advance("2016-01-03", 150),
    gapped = new Map(series);
  gapped.delete(advance(origin, -2));
  assert.equal(fitAt(gapped, new Map(), origin, 1, "ridge-cases"), null);
  assert.equal(fitAt(gapped, new Map(), origin, 1, "mean-4"), null);
  const f = featureVector(series, new Map(), origin, 2, "cases")!;
  assert.ok(!f.names.some((s) => /population|density|city/.test(s)));
  assert.equal(featureVector(series, new Map(), origin, 2, "weather"), null);
});
test("threshold uses previous years and cannot depend on the future target count", () => {
  const origin = advance("2016-01-03", 150),
    target = advance(origin, 2),
    altered = new Map(series);
  altered.set(target, 999999);
  assert.deepEqual(
    endemic(series, target, origin),
    endemic(altered, target, origin),
  );
});
test("calibration waits for outcomes to mature; undefined classification stays unavailable", () => {
  const previous = Array.from({ length: 25 }, (_, i) => ({
    target: advance("2016-01-03", i),
    actual: 20,
    predicted: 10,
  })) as Result[];
  assert.equal(calibrate(previous, "2016-02-01", 5, 10, 5).low80, null);
  const a = calibrate(previous, "2017-01-01", 5, 10, 5);
  assert.equal(a.low80, 0);
  assert.equal(a.high80, 15);
  const poisoned = [
    ...previous,
    { target: "2099-01-01", actual: 999999, predicted: 0 },
  ] as Result[];
  assert.deepEqual(a, calibrate(poisoned, "2017-01-01", 5, 10, 5));
  assert.equal(auc([{ actual: true, p: 0.2 }]), null);
  assert.equal(metrics([]).mae, null);
  assert.equal(metrics([]).precision, null);
});
test("MASE, interval coverage, tied AUC and seeded paired bootstrap are verifiable", () => {
  const rows = Array.from({ length: 20 }, (_, i) => ({
    actual: i % 2 ? 10 : 20,
    predicted: i % 2 ? 12 : 18,
    naive: 15,
    scale: 2,
    low80: 9,
    high80: 21,
    threshold: 15,
    alertProbability: i % 2 ? 0.1 : 0.9,
    horizon: 2,
  })) as Result[];
  const m = metrics(rows);
  assert.equal(m.mae, 2);
  assert.equal(m.rmse, 2);
  assert.equal(m.mase, 1);
  assert.equal(m.skillPercent, 60);
  assert.equal(m.coverage80, 1);
  assert.equal(m.rocAuc, 1);
  assert.equal(m.falseAlarmRate, 0);
  assert.equal(m.meanLeadWeeks, 2);
  assert.equal(
    auc([
      { actual: true, p: 0.5 },
      { actual: false, p: 0.5 },
    ]),
    0.5,
  );
  assert.deepEqual(bootstrapSkill(rows), bootstrapSkill(rows));
});

test("episode lead uses observed consecutive weeks and actual pre-onset calendar origins", () => {
  const make = (
    target: string,
    actual: number,
    model = "naive",
    origin = advance(target, -1),
    horizon = 1,
    probability = 0.8,
  ) =>
    ({
      scenario: "Z",
      target,
      origin,
      horizon,
      model,
      actual,
      predicted: 10,
      naive: 5,
      scale: 1,
      threshold: 5,
      alertProbability: probability,
      riseProbability: 0.5,
      low80: 0,
      high80: 20,
      trainEnd: origin,
      trainN: 50,
    }) as Result;
  const rows = [
    make("2023-01-08", 0),
    make("2023-01-15", 10),
    make("2023-01-22", 10),
    make("2023-02-05", 10),
    make("2023-01-15", 10, "ridge-cases", "2023-01-01", 2),
    make("2023-01-15", 10, "ridge-cases", "2023-01-08", 1),
    make("2023-01-15", 10, "ridge-cases", "2023-02-01", 2),
  ];
  const primary = thresholdEpisodes(rows, "Z", "ridge-cases", [1, 2]);
  assert.equal(primary.eligible_onsets, 1);
  assert.equal(primary.detected_onsets, 1);
  assert.equal(primary.mean_lead_weeks, 2);
  assert.equal(primary.events[0].earliest_alert_origin, "2023-01-01");
  assert.equal(
    thresholdEpisodes(rows, "Z", "ridge-cases", [1]).mean_lead_weeks,
    1,
  );
  assert.equal(
    thresholdEpisodes(rows, "Z", "tree-cases", [1, 2]).detected_onsets,
    0,
  );
  assert.equal(
    thresholdEpisodes(rows, "Z", "tree-cases", [1, 2]).mean_lead_weeks,
    null,
  );
});
