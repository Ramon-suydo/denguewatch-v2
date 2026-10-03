import { lazy, Suspense, useState } from "react";
import { Card, Select } from "./ui";
import cache from "../data/weekly-forecast-v1.json";
import { formatDate } from "../lib/dates";
import { skill } from "../lib/weekly-forecast";
import { SourceCitation } from "./SourceCitation";

const ForecastChart = lazy(() => import("./ForecastChart").then(module => ({ default: module.ForecastChart })));
const modelNames: Record<string, string> = { "seasonal-naive": "Seasonal naive", "mean-4": "4-week mean", ridge: "Ridge regression" };
const number = (n: number | null) => n === null ? "Unavailable" : n.toFixed(2);
const percent = (n: number | null) => n === null ? "Unavailable" : n.toFixed(1) + "%";

export function ForecastPanel({ cityName }: { cityName: string }) {
  const [horizon, setHorizon] = useState(1);
  const [cohort, setCohort] = useState("all-2019-onward");
  const saved = cache.forecasts.find(row => row.city === cityName);
  if (!saved) return <Card><h2>Weekly forecast unavailable</h2><p>No audited weekly cache is available for this LGU.</p></Card>;
  const selected = saved.horizons.find(h => h.horizon === horizon)!;
  const forecast = selected.models.find(m => m.model === cache.selected)!;
  const meanForecast = selected.models.find(m => m.model === "mean-4")!;
  const naive = selected.models.find(m => m.model === "seasonal-naive")!;
  const performance = cache.summary.filter(s => s.cohort === cohort && s.horizon === horizon && (s.city === cityName || s.city === "ALL NCR"));
  const overall = performance.find(s => s.city === "ALL NCR" && s.model === cache.selected)!;
  const meanMetric = performance.find(s => s.city === "ALL NCR" && s.model === "mean-4")!;
  const naiveMetric = performance.find(s => s.city === "ALL NCR" && s.model === "seasonal-naive")!;
  const headline = (model: string, period = "all-2019-onward") => cache.summary.find(s => s.city === "ALL NCR" && s.horizon === 1 && s.cohort === period && s.model === model)!;
  const main = headline(cache.selected), mean = headline("mean-4"), seasonal = headline("seasonal-naive");
  const [firstBaseline, secondBaseline] = [mean, seasonal].sort((a, b) => (a.mae ?? Infinity) - (b.mae ?? Infinity));
  const withoutCovid = headline(cache.selected, "without-covid");
  const strongest = meanMetric.mae !== null && naiveMetric.mae !== null && meanMetric.mae < naiveMetric.mae ? "mean-4" : "seasonal-naive";
  const winsMean = cache.cities.filter(city => {
    const rows = cache.summary.filter(s => s.city === city && s.horizon === horizon && s.cohort === cohort);
    const ridge = rows.find(s => s.model === "ridge")?.mae;
    const baseline = rows.find(s => s.model === "mean-4")?.mae;
    return ridge != null && baseline != null && ridge < baseline;
  }).length;
  const wins = cache.cities.filter(city => {
    const rows = cache.summary.filter(s => s.city === city && s.horizon === horizon && s.cohort === cohort);
    const ridge = rows.find(s => s.model === "ridge")?.mae;
    const baseline = rows.find(s => s.model === "seasonal-naive")?.mae;
    return ridge != null && baseline != null && ridge < baseline;
  }).length;
  const availability = cache.availability.find(a => a.city === cityName && a.horizon === horizon)!;
  const bands = saved.horizons.map(h => {
    const m = h.models.find(row => row.model === cache.selected)!;
    return { date: h.target, estimate: m.predicted,
      band80: m.interval ? [m.interval.low80, m.interval.high80] : null,
      band95: m.interval ? [m.interval.low95, m.interval.high95] : null };
  });
  const series = [
    ...saved.history.map(p => ({ date: p.date, observed: p.cases, estimate: null, band80: null, band95: null })),
    ...bands,
  ];
  const undercoverage = performance.some(s => s.intervalN > 0 && ((s.coverage80 !== null && s.coverage80 < 70) || (s.coverage95 !== null && s.coverage95 < 85)));
  return (
    <section aria-labelledby="weekly-forecast-title" className="content-stack">
      <Card className="forecast-panel">
        <div className="section-heading">
          <h2 id="weekly-forecast-title">Weekly forecast estimates</h2>
          <Select label="Forecast horizon" value={horizon} onChange={e => setHorizon(Number(e.target.value))}>
            <option value={1}>1 week ahead</option><option value={2}>2 weeks ahead</option><option value={4}>4 weeks ahead</option>
          </Select>
        </div>
        <p className="data-notice">
          Historical estimate only. Based on weekly labels through {formatDate(saved.origin)};
          these records cannot establish current conditions. Estimates only, not medical advice
          or official warning levels.
        </p>
        <div className="forecast-numbers">
          <div><span className="muted">Estimated weekly cases</span><strong>{number(forecast.predicted)}</strong></div>
          <div><span className="muted">Target source label</span><strong className="forecast-date">{formatDate(selected.target)}</strong></div>
        </div>
        <p>Model: {modelNames[cache.selected]}. 4-week mean estimate: {number(meanForecast.predicted)} cases; seasonal-naive estimate: {number(naive.predicted)} cases.</p>
        <p className="muted">Shaded bands: nominal 80% and 95% prediction intervals from earlier out-of-sample errors, not guaranteed coverage. The 1/2/4-week points are separate direct forecasts; connecting lines do not supply a 3-week forecast.</p>
        <figure>
          <figcaption>Recent observed cases (gray), estimates (teal), 80% band (teal), 95% band (gray). Exact values below.</figcaption>
          <Suspense fallback={<div className="history-chart chart-skeleton" role="status">Loading forecast chart…</div>}>
            <ForecastChart data={series} />
          </Suspense>
        </figure>
        <div className="table-scroll" role="region" aria-label="Forecast estimates and prediction intervals" tabIndex={0}>
          <table>
            <caption>{cityName}: historical weekly forecasts using {modelNames[cache.selected]}</caption>
            <thead><tr><th scope="col">Ahead</th><th scope="col">Target label</th><th scope="col">Estimate</th><th scope="col">80% interval</th><th scope="col">95% interval</th><th scope="col">Calibration errors</th></tr></thead>
            <tbody>{saved.horizons.map(h => {
              const m = h.models.find(row => row.model === cache.selected)!;
              return <tr key={h.horizon}><th scope="row">{h.horizon} weeks</th><td>{formatDate(h.target)}</td><td>{number(m.predicted)}</td><td>{m.interval ? `${number(m.interval.low80)} to ${number(m.interval.high80)}` : "Unavailable"}</td><td>{m.interval ? `${number(m.interval.low95)} to ${number(m.interval.high95)}` : "Unavailable"}</td><td>{m.interval?.n ?? 0}</td></tr>;
            })}</tbody>
          </table>
        </div>
      </Card>
      <Card className="prose" role="region" aria-labelledby="model-transparency-title">
        <h2 id="model-transparency-title">Model transparency</h2>
        <p>Predicts weekly reported case counts per LGU at {saved.horizons.map(h => h.horizon).join("/")} weeks ahead, using source date labels.</p>
        <p>Inputs: the four most recent weekly counts available at the origin (lags 1–4 for the one-week forecast), the target’s 52-week lag, and annual sine/cosine seasonality. Each LGU and horizon has its own fit and intercept. Multi-step fits use only counts known at the origin.</p>
        <p>Training: {formatDate(cache.metadata.trainWindow.first)} through each rolling origin, with training-only scaling. Windows: {cache.metadata.evaluation}.</p>
        <p>Test evidence ends {formatDate(cache.metadata.trainWindow.last)}. There is no evidence on later years. This is a short-horizon count model, not a season-level outbreak prediction.</p>
        <p data-testid="headline-baseline-comparison">One-week test MAE: {modelNames[cache.selected]} {number(main.mae)} versus the strongest baseline, {modelNames[firstBaseline.model]} {number(firstBaseline.mae)} ({percent(skill(main.mae, firstBaseline.mae))} MAE skill); then {modelNames[secondBaseline.model]} {number(secondBaseline.mae)} ({percent(skill(main.mae, secondBaseline.mae))} MAE skill.</p>
        <p>Most of the observed gain over seasonal naive is already achieved by the mean of recent case counts: {percent(skill(mean.mae, seasonal.mae))} MAE skill, compared with {percent(skill(main.mae, seasonal.mae))} for {modelNames[cache.selected]}. This comparison does not isolate each feature’s effect.</p>
        <h3>Known limitations</h3>
        <ul>
          <li data-testid="smape-limitation">One-week test sMAPE is {percent(main.smape)} versus {percent(mean.smape)} for the mean baseline. {main.smape !== null && mean.smape !== null && main.smape > mean.smape ? "The model is worse on this relative-error measure." : "Read this measure alongside MAE."} sMAPE is especially sensitive in low-case weeks; the cache does not provide a separate low-case-week score.</li>
          <li data-testid="interval-limitation">Without COVID-period targets, one-week interval coverage is {percent(withoutCovid.coverage80)}/{percent(withoutCovid.coverage95)}, versus nominal 80%/95%. {withoutCovid.coverage80 !== null && withoutCovid.coverage95 !== null && (withoutCovid.coverage80 < 80 || withoutCovid.coverage95 < 95) ? "Intervals under-cover in this period." : "Coverage can change in other periods."}</li>
          <li>Missing weeks and suspect rows remain unavailable, not zero. All models are compared on common supported targets; scores do not describe excluded observations.</li>
          <li>COVID-era reporting may differ from earlier reporting. Source labels do not prove when observations were actually published; later revisions could change a live backtest.</li>
          <li>Deaths, monthly aggregates, Manila daily data, and unverified community reports are excluded from the weekly model. Historical counts cannot establish current risk.</li>
        </ul>
        <h3>What would improve it</h3>
        <ul>
          <li>Newer DOH weekly data and more years for recent-period validation and interval calibration.</li>
          <li>Rainfall and temperature features aligned to geography and information available at each forecast origin, tested against the existing baselines.</li>
          <li>Reviewed aggregate barangay data with consistent boundaries, reporting coverage and small-count privacy protections; it requires a separate geographic evaluation.</li>
        </ul>
        <p>Additional data may help, but any gain needs a new chronological backtest; none is promised.</p>
      </Card>
      <Card className="prose">
        <h2>Model performance</h2>
        <Select label="Backtest reporting period" value={cohort} onChange={e => setCohort(e.target.value)}>
          <option value="all-2019-onward">2019 onward, including COVID period</option>
          <option value="without-covid">Without COVID-period targets (2019 only)</option>
          <option value="covid-only">COVID-period targets (2020–January 2021)</option>
          <option value="development-2018">2018 development, not held-out test</option>
        </Select>
        <p>Ridge beats the 4-week mean in {winsMean} of {cache.cities.length} LGUs at the {horizon}-week horizon. Ridge beats seasonal naive in {wins} of {cache.cities.length} LGUs at the {horizon}-week horizon for this period. This is lower MAE, not an accuracy percentage.</p>
        <p>{modelNames[cache.selected]} is the shipped default, selected using 2018 one-week development MAE only. Ridge must beat both baselines by at least 5% and improve a majority of LGUs. 2019 onward outcomes do not choose the model.</p>
        <p data-testid="slice-baseline-comparison">Skill versus the 4-week mean: {percent(skill(overall.mae, meanMetric.mae))}; versus seasonal naive: {percent(skill(overall.mae, naiveMetric.mae))}. Strongest baseline in this reporting slice: {modelNames[strongest]}.</p>
        <p>{modelNames[cache.selected]} overall: MAE {number(overall.mae)}, RMSE {number(overall.rmse)}, sMAPE {percent(overall.smape)}. Overall metrics pool LGU-target observations; high-count LGUs can dominate case-error metrics.</p>
        {undercoverage && <p className="data-notice">Interval coverage is more than 10 percentage points below nominal for at least one displayed model. These intervals are poorly calibrated in this period; do not interpret them as guaranteed probabilities.</p>}
        <div className="table-scroll" role="region" aria-label="Walk-forward model performance" tabIndex={0}>
          <table>
            <caption>Matched targets only; errors in cases, sMAPE and skill in percent. Negative skill means worse than the named baseline.</caption>
            <thead><tr><th scope="col">Scope</th><th scope="col">Model</th><th scope="col">N</th><th scope="col">MAE</th><th scope="col">RMSE</th><th scope="col">sMAPE</th><th scope="col">Skill vs 4-week mean</th><th scope="col">Skill vs naive</th><th scope="col">80% coverage</th><th scope="col">95% coverage</th><th scope="col">Interval N</th></tr></thead>
            <tbody>{performance.map(s => <tr key={s.city + s.model}><th scope="row">{s.city}</th><td>{modelNames[s.model]}</td><td>{s.n}</td><td>{number(s.mae)}</td><td>{number(s.rmse)}</td><td>{percent(s.smape)}</td><td>{percent(skill(s.mae, performance.find(row => row.city === s.city && row.model === "mean-4")!.mae))}</td><td>{percent(s.skill)}</td><td>{percent(s.coverage80)}</td><td>{percent(s.coverage95)}</td><td>{s.intervalN}</td></tr>)}</tbody>
          </table>
        </div>
        <p>COVID caveat: 2020–2021 is flagged as a distorted reporting period, not proof of changed disease incidence. Removing those targets leaves only 2019 for evaluation; it does not remove earlier COVID observations from later rolling training windows.</p>
        <p>Common support for {cityName}, {horizon}-week horizon: {availability.paired} of {availability.targets} calendar targets from 2019 onward. Missing or suspect targets, missing exact lags, and insufficient training history are skipped for every model, never replaced by zero. Metrics do not describe the excluded observations.</p>
        <details className="method-details">
          <summary>Inputs, training and interval limitations</summary>
          <p>{cache.metadata.ridge}</p>
          <p>{cache.metadata.gaps}</p>
          <p>{cache.metadata.intervals}</p>
          <p>Deaths, population, weather, community reports, monthly aggregates and Manila daily data are not predictors. The source has {cache.metadata.observations.toLocaleString("en-PH")} weekly rows; {cache.metadata.excludedSuspectRows} flagged suspect rows are unavailable to fitting and scoring. Available large peaks are retained.</p>
          <p>Intervals use local historical residuals and are uncertain with small samples or reporting shifts. sMAPE is zero when actual and forecast are both zero; it can be large for small counts. Ridge can improve MAE while worsening sMAPE. Forecasts are weekly counts at source date labels, not individual infection probabilities.</p>
          <p>Training window: {cache.metadata.trainWindow.first} to each origin, ending {cache.metadata.trainWindow.last}. Version: {cache.metadata.version}; generated {formatDate(cache.metadata.runAt)}. Bundled research cache; independent of the legacy monthly risk table.</p>
          <p>Source: {cache.metadata.source}. SHA-256: <code>{cache.metadata.checksum.slice(0, 32)}<wbr />{cache.metadata.checksum.slice(32)}</code>.</p>
          <SourceCitation source={cache.metadata.source} />
        </details>
      </Card>
    </section>
  );
}
