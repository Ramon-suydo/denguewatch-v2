import { completeMonth, computeForecast, MONTHLY_SOURCE } from "./forecast";
import { nextMonth } from "./dates";
import type { CommunityWeek, Observation } from "./types";

export function seasonality(
  rows: Observation[],
  target: string,
  cutoff: string,
) {
  const eligible = rows.filter(
    (r) => r.period_start < cutoff && completeMonth(r, cutoff),
  );
  const months = Array.from({ length: 12 }, (_, i) =>
    eligible.filter((r) => Number(r.period_start.slice(5, 7)) === i + 1),
  );
  const samples = months[Number(target.slice(5, 7)) - 1];
  // Equal weighting of calendar-month means prevents missing months from changing
  // the annual reference. Require two observations for EVERY calendar month.
  if (months.some((m) => m.length < 2))
    return { ratio: null, samples: samples.length };
  const means = months.map(
    (m) => m.reduce((s, r) => s + r.cases, 0) / m.length,
  );
  const annual = means.reduce((s, n) => s + n, 0) / 12;
  return {
    ratio: annual > 0 ? means[Number(target.slice(5, 7)) - 1] / annual : null,
    samples: samples.length,
  };
}
export function candidate(base: number, ratio: number | null) {
  // Predeclared candidate: F = .75*WMA + .25*(WMA*seasonal ratio).
  // Community=0 (no aligned historical validation), weather=0 (unavailable).
  return ratio === null ? base : 0.75 * base + 0.25 * base * ratio;
}
export function backtest(rows: Observation[]) {
  const predictions: {
    city: string;
    target: string;
    actual: number;
    baseline: number;
    composite: number;
    p50: number;
    p80: number;
  }[] = [];
  for (const city of [...new Set(rows.map((r) => r.lgu_id))]) {
    const cityRows = rows
      .filter((r) => r.lgu_id === city && r.source === MONTHLY_SOURCE)
      .sort((a, b) => a.period_start.localeCompare(b.period_start));
    for (const target of cityRows) {
      if (!completeMonth(target, nextMonth(target.period_start))) continue;
      const train = cityRows.filter(
        (r) => r.period_start < target.period_start,
      );
      const f = computeForecast(city, train, target.period_start);
      if (
        f.predicted_cases === null ||
        f.p50 === null ||
        f.p80 === null ||
        f.p80 <= f.p50 ||
        f.forecast_for !== target.period_start
      )
        continue;
      const seasonal = seasonality(
        train,
        target.period_start,
        target.period_start,
      );
      if (seasonal.ratio === null) continue; // paired evaluation only
      predictions.push({
        city,
        target: target.period_start,
        actual: target.cases,
        baseline: f.predicted_cases,
        composite: candidate(f.predicted_cases, seasonal.ratio),
        p50: f.p50,
        p80: f.p80,
      });
    }
  }
  const metrics = (
    sample: typeof predictions,
    model: "baseline" | "composite",
  ) => {
    const error = sample.reduce((s, r) => s + Math.abs(r[model] - r.actual), 0);
    const total = sample.reduce((s, r) => s + r.actual, 0);
    const tier = (n: number, r: (typeof predictions)[number]) =>
      n <= r.p50 ? 0 : n <= r.p80 ? 1 : 2;
    return {
      n: sample.length,
      mae: sample.length ? error / sample.length : null,
      wape: total ? error / total : null,
      tierAccuracy: sample.length
        ? sample.filter((r) => tier(r[model], r) === tier(r.actual, r)).length /
          sample.length
        : null,
    };
  };
  // Chronological split fixed before inspecting outcomes. 2020 is final holdout;
  // earlier eligible origins are development. No target or future row enters inputs.
  const development = predictions.filter((r) => r.target < "2020-01-01");
  const holdout = predictions.filter(
    (r) => r.target >= "2020-01-01" && r.target < "2021-01-01",
  );
  const summarize = (sample: typeof predictions) => ({
    baseline: metrics(sample, "baseline"),
    composite: metrics(sample, "composite"),
  });
  const dev = summarize(development),
    test = summarize(holdout);
  const perCity = [...new Set(predictions.map((r) => r.city))].map((city) => ({
    city,
    ...summarize(holdout.filter((r) => r.city === city)),
  }));
  const improves = (m: ReturnType<typeof summarize>) =>
    m.baseline.mae !== null &&
    m.composite.mae !== null &&
    m.composite.mae <= 0.95 * m.baseline.mae;
  const selected =
    improves(dev) &&
    improves(test) &&
    perCity.filter(
      (c) =>
        c.baseline.mae !== null &&
        c.composite.mae !== null &&
        c.composite.mae < c.baseline.mae,
    ).length >
      perCity.length / 2;
  return { selected, development: dev, holdout: test, perCity, predictions };
}
export function communitySignal(weeks: CommunityWeek[], today: string) {
  const date = new Date(today + "T00:00:00Z");
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  const starts = Array.from({ length: 8 }, (_, i) => {
    const d = new Date(date);
    d.setUTCDate(d.getUTCDate() - 7 * (8 - i));
    return d.toISOString().slice(0, 10);
  });
  const counts = starts.map(
    (start) => weeks.find((w) => w.week_start === start)?.report_count,
  );
  if (counts.some((n) => n === undefined))
    return {
      direction: null,
      ratio: null,
      status:
        "Unavailable: at least one complete week has no public count (zero or privacy-suppressed).",
    };
  const previous = counts
    .slice(0, 4)
    .reduce<number>((s, n) => s + Number(n), 0);
  const recent = counts.slice(4).reduce<number>((s, n) => s + Number(n), 0);
  return {
    direction: recent > previous ? "up" : recent < previous ? "down" : "flat",
    ratio: previous ? recent / previous : null,
    status:
      "Unverified published counts: last four complete weeks versus preceding four; context only.",
  };
}
export function riskInputs(
  rows: Observation[],
  today: string,
  selected: boolean,
  weeks: CommunityWeek[] = [],
) {
  const f = computeForecast(rows[0]?.lgu_id ?? "", rows, today);
  const target = f.forecast_for ?? today;
  const seasonal = seasonality(rows, target, target);
  const current = seasonality(rows, today, today);
  const weight = selected && seasonal.ratio !== null ? 0.25 : 0;
  const base = f.predicted_cases;
  return {
    scope: "city",
    target,
    evaluated_on: today,
    trend: {
      weight: 1 - weight,
      value: base,
      contribution: base === null ? null : (1 - weight) * base,
    },
    seasonality: {
      weight,
      ratio: seasonal.ratio,
      samples: seasonal.samples,
      contribution:
        base === null ? null : weight * base * (seasonal.ratio ?? 1),
      status: weight
        ? "retained"
        : "not retained: meaningful improvement criterion not met or insufficient seasonal history",
    },
    current_calendar_seasonality: {
      month: today.slice(0, 7),
      ...current,
      high_season: current.ratio === null ? null : current.ratio > 1,
      contribution: 0,
      status: "context only; cannot refresh stale surveillance",
    },
    community: {
      signal: communitySignal(weeks, today),
      weight: 0,
      contribution: 0,
      status:
        "unverified; no aligned historical series for validation; suppressed counts are not zeros; cannot elevate any risk tier",
    },
    weather: {
      weight: 0,
      contribution: 0,
      status: "unvalidated for this legacy risk score; weather contribution excluded",
    },
    latest: rows
      .filter((r) => r.source === MONTHLY_SOURCE && r.period_start <= today)
      .sort((a, b) => a.period_start.localeCompare(b.period_start))
      .slice(-2)
      .map((r) => ({
        date: r.period_start,
        cases: r.cases,
        complete: completeMonth(r, today),
      })),
  };
}
