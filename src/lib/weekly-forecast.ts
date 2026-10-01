export const WEEKLY_SOURCE = "doh-epi-dengue-data-2016-2021.csv";
export const WEEKLY_VERSION = "weekly-ridge-v1";
export const MODELS = ["seasonal-naive", "mean-4", "ridge"] as const;
export const HORIZONS = [1, 2, 4] as const;
export type WeeklyModel = (typeof MODELS)[number];
export interface WeeklyInput { city: string; date: string; cases: number; excluded: boolean }
export interface Bounds { low80: number; high80: number; low95: number; high95: number; n: number }
export interface Prediction {
  city: string; origin: string; target: string; horizon: number; model: WeeklyModel;
  actual: number; predicted: number; interval: Bounds | null;
  trainEnd: string | null; trainN: number;
}
export function week(date: string, offset: number): string {
  return new Date(Date.parse(date + "T00:00:00Z") + offset * 7 * 86400000).toISOString().slice(0, 10);
}
export function weeklyMap(rows: WeeklyInput[], city: string): Map<string, number> {
  const known = new Set<string>();
  const result = new Map<string, number>();
  for (const row of rows.filter(r => r.city === city)) {
    const d = new Date(row.date + "T00:00:00Z");
    if (!Number.isFinite(d.getTime()) || d.toISOString().slice(0, 10) !== row.date || d.getUTCDay() !== 0 || !Number.isSafeInteger(row.cases) || row.cases < 0)
      throw new Error("Invalid weekly observation");
    if (known.has(row.date)) throw new Error("Duplicate weekly observation");
    known.add(row.date);
    if (!row.excluded) result.set(row.date, row.cases);
  }
  return result;
}
function features(series: Map<string, number>, origin: string, horizon: number): number[] | null {
  const target = week(origin, horizon);
  const lags = [0, -1, -2, -3].map(k => series.get(week(origin, k)));
  const seasonal = series.get(week(target, -52));
  if (lags.some(n => n === undefined) || seasonal === undefined) return null;
  // A 52-week cycle preserves the source's Sunday labels; it is not ISO week matching.
  const phase = 2 * Math.PI * (Date.parse(target) / (7 * 86400000)) / 52;
  return [...lags.map(n => Math.log1p(n!)), Math.log1p(seasonal),
    Math.sin(phase), Math.cos(phase), Math.sin(2 * phase), Math.cos(2 * phase)];
}
function solve(matrix: number[][], vector: number[]): number[] {
  const a = matrix.map((row, i) => [...row, vector[i]]);
  for (let k = 0; k < a.length; k++) {
    let pivot = k;
    for (let i = k + 1; i < a.length; i++) if (Math.abs(a[i][k]) > Math.abs(a[pivot][k])) pivot = i;
    [a[k], a[pivot]] = [a[pivot], a[k]];
    if (Math.abs(a[k][k]) < 1e-12) throw new Error("Singular ridge fit");
    const divisor = a[k][k];
    for (let j = k; j <= a.length; j++) a[k][j] /= divisor;
    for (let i = 0; i < a.length; i++) if (i !== k) {
      const factor = a[i][k];
      for (let j = k; j <= a.length; j++) a[i][j] -= factor * a[k][j];
    }
  }
  return a.map(row => row.at(-1)!);
}
export function forecastAt(series: Map<string, number>, origin: string, horizon: number) {
  if (!(HORIZONS as readonly number[]).includes(horizon)) throw new Error("Unsupported horizon");
  // Even callers passing a full series cannot expose future observations to fitting.
  const past = new Map([...series].filter(([date]) => date <= origin));
  const target = week(origin, horizon);
  const seasonal = past.get(week(target, -52));
  const lags = [0, -1, -2, -3].map(k => past.get(week(origin, k)));
  const mean = lags.every(n => n !== undefined) ? lags.reduce<number>((s, n) => s + n!, 0) / 4 : null;
  const x = features(past, origin, horizon);
  const train = [...past].sort(([a], [b]) => a.localeCompare(b)).flatMap(([date, cases]) => {
    const input = features(past, week(date, -horizon), horizon);
    return input ? [{ date, x: input, y: Math.log1p(cases) }] : [];
  });
  let ridge: number | null = null;
  if (x && train.length >= 52) {
    const width = x.length;
    const means = x.map((_, j) => train.reduce((s, row) => s + row.x[j], 0) / train.length);
    const scales = means.map((m, j) => Math.sqrt(train.reduce((s, row) => s + (row.x[j] - m) ** 2, 0) / train.length) || 1);
    const standardize = (values: number[]) => [1, ...values.map((v, j) => (v - means[j]) / scales[j])];
    const matrix = Array.from({ length: width + 1 }, () => Array(width + 1).fill(0) as number[]);
    const vector = Array(width + 1).fill(0) as number[];
    for (const row of train) {
      const z = standardize(row.x);
      for (let j = 0; j < z.length; j++) {
        vector[j] += z[j] * row.y;
        for (let k = 0; k < z.length; k++) matrix[j][k] += z[j] * z[k];
      }
    }
    // Fixed lambda=10. No tuning on evaluation outcomes; intercept is unpenalized.
    for (let j = 1; j <= width; j++) matrix[j][j] += 10;
    const coefficients = solve(matrix, vector);
    const z = standardize(x);
    const value = Math.max(0, Math.expm1(coefficients.reduce((s, c, j) => s + c * z[j], 0)));
    if (Number.isFinite(value)) ridge = value;
  }
  return {
    values: { "seasonal-naive": seasonal ?? null, "mean-4": mean, ridge },
    trainEnd: train.at(-1)?.date ?? null, trainN: train.length,
  };
}
export function residualQuantile(values: number[], p: number): number {
  if (!values.length) throw new Error("No residuals");
  const sorted = [...values].sort((a, b) => a - b);
  const rank = p * (sorted.length - 1), low = Math.floor(rank), high = Math.ceil(rank);
  return sorted[low] + (sorted[high] - sorted[low]) * (rank - low);
}
export function intervalAt(predicted: number, previous: Prediction[], origin: string): Bounds | null {
  // Multi-step errors only become observable at their target label, not their origin.
  const residuals = previous.filter(p => p.origin < origin && p.target <= origin).map(p => p.actual - p.predicted);
  if (residuals.length < 30) return null;
  const bound = (p: number) => Math.max(0, predicted + residualQuantile(residuals, p));
  return { low80: bound(.1), high80: bound(.9), low95: bound(.025), high95: bound(.975), n: residuals.length };
}
export function metric(sample: Pick<Prediction, "actual" | "predicted" | "interval">[]) {
  const n = sample.length;
  const calibrated = sample.filter(p => p.interval !== null);
  const coverage = (level: 80 | 95) => calibrated.length ? 100 * calibrated.filter(p => {
    const b = p.interval!;
    return p.actual >= (level === 80 ? b.low80 : b.low95) && p.actual <= (level === 80 ? b.high80 : b.high95);
  }).length / calibrated.length : null;
  return {
    n,
    mae: n ? sample.reduce((s, p) => s + Math.abs(p.actual - p.predicted), 0) / n : null,
    rmse: n ? Math.sqrt(sample.reduce((s, p) => s + (p.actual - p.predicted) ** 2, 0) / n) : null,
    smape: n ? sample.reduce((s, p) => s + (p.actual + p.predicted === 0 ? 0 : 200 * Math.abs(p.actual - p.predicted) / (Math.abs(p.actual) + Math.abs(p.predicted))), 0) / n : null,
    intervalN: calibrated.length, coverage80: coverage(80), coverage95: coverage(95),
  };
}
export function skill(mae: number | null, baseline: number | null): number | null {
  return mae === null || baseline === null || baseline === 0 ? null : 100 * (baseline - mae) / baseline;
}
export type Cohort = "development-2018" | "all-2019-onward" | "without-covid" | "covid-only";
export function inCohort(target: string, cohort: Cohort): boolean {
  if (cohort === "development-2018") return target >= "2018-01-01" && target < "2019-01-01";
  if (target < "2019-01-01") return false;
  if (cohort === "without-covid") return target < "2020-01-01";
  if (cohort === "covid-only") return target >= "2020-01-01";
  return true;
}
export function summarize(predictions: Prediction[], cities: string[]) {
  return (["development-2018", "all-2019-onward", "without-covid", "covid-only"] as Cohort[]).flatMap(cohort =>
    ["ALL NCR", ...cities].flatMap(city => HORIZONS.flatMap(horizon => {
      const rows = predictions.filter(p => (city === "ALL NCR" || p.city === city) && p.horizon === horizon && inCohort(p.target, cohort));
      const baseline = metric(rows.filter(p => p.model === "seasonal-naive")).mae;
      return MODELS.map(model => {
        const metrics = metric(rows.filter(p => p.model === model));
        return { cohort, city, horizon, model, ...metrics, skill: skill(metrics.mae, baseline) };
      });
    })));
}
export function selectModel(summary: ReturnType<typeof summarize>, cities: string[]): WeeklyModel {
  const dev = (model: WeeklyModel, city = "ALL NCR") => summary.find(s => s.cohort === "development-2018" && s.horizon === 1 && s.city === city && s.model === model)?.mae ?? null;
  const seasonal = dev("seasonal-naive"), mean = dev("mean-4"), ridge = dev("ridge");
  if (seasonal === null || mean === null || ridge === null) return "seasonal-naive";
  const wins = cities.filter(city => {
    const r = dev("ridge", city), s = dev("seasonal-naive", city), m = dev("mean-4", city);
    return r !== null && s !== null && m !== null && r < Math.min(s, m);
  }).length;
  return ridge <= .95 * Math.min(seasonal, mean) && wins > cities.length / 2 ? "ridge" : mean < seasonal ? "mean-4" : "seasonal-naive";
}
export function runWeeklyBacktest(rows: WeeklyInput[]) {
  const cities = [...new Set(rows.map(r => r.city))].sort();
  const predictions: Prediction[] = [];
  const forecasts = [];
  const availability: { city: string; horizon: number; targets: number; paired: number }[] = [];
  for (const city of cities) {
    const cityRows = rows.filter(r => r.city === city).sort((a, b) => a.date.localeCompare(b.date));
    const series = weeklyMap(rows, city);
    const first = cityRows[0].date, last = cityRows.at(-1)!.date;
    const residuals = new Map<string, Prediction[]>(HORIZONS.flatMap(h => MODELS.map(m => [`${h}:${m}`, [] as Prediction[]] as const)));
    for (const horizon of HORIZONS) {
      let targets = 0, paired = 0;
      for (let origin = first; week(origin, horizon) <= last; origin = week(origin, 1)) {
        const target = week(origin, horizon);
        if (target < "2018-01-01") continue;
        if (target >= "2019-01-01") targets++;
        const actual = series.get(target);
        if (actual === undefined) continue;
        const fit = forecastAt(series, origin, horizon);
        // Compare every model on identical targets; skipped cases are disclosed.
        if (MODELS.some(model => fit.values[model] === null)) continue;
        if (target >= "2019-01-01") paired++;
        for (const model of MODELS) {
          const previous = residuals.get(`${horizon}:${model}`)!;
          const predicted = fit.values[model]!;
          const record: Prediction = { city, origin, target, horizon, model, actual, predicted,
            interval: intervalAt(predicted, previous, origin),
            trainEnd: model === "ridge" ? fit.trainEnd : null,
            trainN: model === "ridge" ? fit.trainN : model === "mean-4" ? 4 : 1 };
          previous.push(record);
          predictions.push(record);
        }
      }
      availability.push({ city, horizon, targets, paired });
    }
    forecasts.push({ city, origin: last, history: Array.from({ length: 12 }, (_, i) => {
      const date = week(last, i - 11); return { date, cases: series.get(date) ?? null };
    }), horizons: HORIZONS.map(horizon => {
      const fit = forecastAt(series, last, horizon);
      return { horizon, target: week(last, horizon), models: MODELS.map(model => {
        const predicted = fit.values[model];
        return { model, predicted, interval: predicted === null ? null : intervalAt(predicted, residuals.get(`${horizon}:${model}`)!, last) };
      }) };
    }) });
  }
  const summary = summarize(predictions, cities);
  return { cities, predictions, summary, selected: selectModel(summary, cities), forecasts, availability };
}
