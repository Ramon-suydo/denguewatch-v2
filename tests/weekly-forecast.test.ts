import test from "node:test";
import assert from "node:assert/strict";
import { forecastAt, week, weeklyMap, intervalAt, metric, skill, inCohort, runWeeklyBacktest, selectModel, type WeeklyInput, type Prediction } from "../src/lib/weekly-forecast.ts";

function fixture(n = 230): WeeklyInput[] {
  return Array.from({ length: n }, (_, i) => ({ city: "TEST", date: week("2016-01-10", i), cases: Math.round(20 + 12 * (1 + Math.sin(i * Math.PI / 26)) + i / 10), excluded: false }));
}
test("weekly forecasts never read future cases, future training labels, or unobserved multi-step residuals", () => {
  const rows = fixture(), series = weeklyMap(rows, "TEST"), origin = rows[180].date;
  const expected = forecastAt(series, origin, 4);
  assert.ok(expected.values.ridge !== null);
  assert.ok(expected.trainEnd! <= origin);
  const futureChanged = new Map([...series].map(([date, cases]) => [date, date > origin ? 999999 : cases]));
  assert.deepEqual(forecastAt(futureChanged, origin, 4), expected);
  assert.deepEqual(forecastAt(new Map([...series].filter(([date]) => date <= origin)), origin, 4), expected);
  const earlier: Prediction[] = Array.from({ length: 35 }, (_, i) => ({ city: "TEST", horizon: 4, model: "ridge", origin: week(origin, -50 + i), target: week(origin, -46 + i), actual: 20 + i, predicted: 20, interval: null, trainEnd: null, trainN: 52 }));
  const interval = intervalAt(30, earlier, origin);
  assert.deepEqual(intervalAt(30, [...earlier, { ...earlier[0], origin: week(origin, -1), target: week(origin, 3), actual: 999999 }], origin), interval);
  assert.equal(interval!.n, 35);
  assert.equal(intervalAt(30, earlier.slice(0, 29), origin), null);
});
test("weekly gaps and suspect observations never become zero, shifted lags or interpolated training examples", () => {
  const rows = fixture(), origin = rows[180].date;
  rows[179].excluded = true;
  const series = weeklyMap(rows, "TEST");
  assert.equal(series.has(rows[179].date), false);
  const fit = forecastAt(series, origin, 1);
  assert.equal(fit.values["mean-4"], null);
  assert.equal(fit.values.ridge, null);
  assert.equal(fit.values["seasonal-naive"], rows[129].cases);
  const seasonalGap = weeklyMap(fixture(), "TEST");
  seasonalGap.delete(rows[129].date);
  assert.equal(forecastAt(seasonalGap, origin, 1).values["seasonal-naive"], null);
  assert.equal(forecastAt(seasonalGap, origin, 1).values.ridge, null);
  assert.throws(() => weeklyMap([...rows, rows[0]], "TEST"), /Duplicate/);
  const zeroRows = fixture(); zeroRows[180].cases = 0;
  assert.equal(weeklyMap(zeroRows, "TEST").get(origin), 0);
});
test("MAE, RMSE, zero-safe sMAPE, skill and empirical interval coverage match tiny hand-calculated examples", () => {
  const bounds = { low80: 1, high80: 3, low95: 0, high95: 5, n: 30 };
  const result = metric([
    { actual: 0, predicted: 0, interval: null },
    { actual: 2, predicted: 4, interval: bounds },
    { actual: 4, predicted: 2, interval: bounds },
  ]);
  assert.equal(result.mae, 4 / 3);
  assert.equal(result.rmse, Math.sqrt(8 / 3));
  assert.ok(Math.abs(result.smape! - 400 / 9) < 1e-10);
  assert.equal(result.coverage80, 50);
  assert.equal(result.coverage95, 100);
  assert.equal(result.intervalN, 2);
  assert.equal(skill(3, 2), -50);
  assert.equal(skill(0, 0), null);
  assert.equal(metric([]).mae, null);
  assert.equal(metric([{ actual: 0, predicted: 0, interval: null }]).smape, 0);
});
test("rolling evaluation compares identical targets and reports COVID by target date; model selection ignores test outcomes", () => {
  const rows = fixture(); rows[160].excluded = true;
  const result = runWeeklyBacktest(rows);
  assert.ok(result.predictions.length > 0);
  for (const p of result.predictions) {
    assert.equal(p.target, week(p.origin, p.horizon));
    assert.ok(p.trainEnd === null || p.trainEnd <= p.origin);
    assert.notEqual(p.target, rows[160].date);
    assert.equal(result.predictions.filter(other => other.city === p.city && other.origin === p.origin && other.horizon === p.horizon).length, 3);
  }
  const selected = selectModel(result.summary, result.cities);
  const alteredTest = result.summary.map(s => s.cohort === "development-2018" ? s : { ...s, mae: s.model === "ridge" ? 1e9 : 0 });
  assert.equal(selectModel(alteredTest, result.cities), selected);
  assert.equal(inCohort("2019-12-29", "without-covid"), true);
  assert.equal(inCohort("2020-01-05", "without-covid"), false);
  assert.equal(inCohort("2021-01-10", "covid-only"), true);
});
