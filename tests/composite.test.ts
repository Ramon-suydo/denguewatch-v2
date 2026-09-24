import { test } from "node:test";
import assert from "node:assert/strict";
import { loadDataset } from "../scripts/lib/historical.ts";
import { backtest, communitySignal, riskInputs } from "../src/lib/composite.ts";
import type { Observation } from "../src/lib/types.ts";
test("real-data paired backtest excludes future targets, rejects candidate and records all factors", async () => {
  const data = await loadDataset("data/raw");
  const rows = data.observations.map((r, i) => ({
    ...r,
    id: i,
    lgu_id: r.lgu_name,
  })) as Observation[];
  const result = backtest(rows);
  assert.equal(result.selected, false);
  assert.equal(result.holdout.baseline.n, 138);
  assert.ok(result.holdout.composite.mae! < result.holdout.baseline.mae!);
  const cutoff = "2020-06-01";
  const altered = rows.map((r) =>
    r.period_start >= cutoff ? { ...r, cases: r.cases + 100000 } : r,
  );
  assert.deepEqual(
    backtest(altered).predictions.filter((r) => r.target < cutoff),
    result.predictions.filter((r) => r.target < cutoff),
  );
  const inputs = riskInputs(
    rows.filter((r) => r.lgu_id === rows[0].lgu_id),
    "2026-09-24",
    false,
  );
  assert.equal(inputs.trend.weight, 1);
  assert.equal(inputs.seasonality.contribution, 0);
  assert.equal(inputs.community.weight, 0);
  assert.equal(inputs.weather.weight, 0);
  assert.equal(inputs.latest.length, 2);
});
test("suppressed community weeks never become zeros; only complete weeks compare", () => {
  assert.equal(communitySignal([], "2026-09-24").ratio, null);
  const starts = [
    "2026-07-27",
    "2026-08-03",
    "2026-08-10",
    "2026-08-17",
    "2026-08-24",
    "2026-08-31",
    "2026-09-07",
    "2026-09-14",
  ];
  const weeks = starts.map((week_start, i) => ({
    lgu_id: "x",
    week_start,
    report_count: i < 4 ? 5 : 10,
  }));
  assert.equal(communitySignal(weeks, "2026-09-24").ratio, 2);
  assert.equal(communitySignal(weeks.slice(1), "2026-09-24").direction, null);
});
