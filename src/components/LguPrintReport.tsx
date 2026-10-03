import { useState, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { Button } from "./ui";
import { SharedDisclaimer } from "./SharedDisclaimer";
import { SourceCitation } from "./SourceCitation";
import { fetchHistory } from "../lib/api";
import { useResource } from "../lib/resources";
import { snapshotDate, subscribeSnapshot } from "../lib/demo-snapshot";
import { formatDate } from "../lib/dates";
import { skill } from "../lib/weekly-forecast";
import type { City } from "../lib/types";
import cache from "../data/weekly-forecast-v1.json";
import { colors } from "../theme/palette.js";
const value = (n: number | null | undefined) => n == null ? "Unavailable" : n.toFixed(2);
export function LguPrintReport({ city }: { city: City }) {
  const history = useResource("print-weekly:" + city.id, signal => fetchHistory(city.id, "week", signal));
  const snapshot = useSyncExternalStore(subscribeSnapshot, snapshotDate, () => null);
  const [generated, setGenerated] = useState(() => new Date().toISOString());
  const rows = history.data ?? [], recent = rows.slice(-12), latest = rows.at(-1), previous = rows.at(-2);
  const contiguous = latest && previous && Date.parse(latest.period_start) - Date.parse(previous.period_start) === 7 * 86400000;
  const saved = cache.forecasts.find(row => row.city === city.name);
  const first = recent[0] ? Date.parse(recent[0].period_start) : 0;
  const span = latest ? Math.max(7 * 86400000, Date.parse(latest.period_start) - first) : 1;
  const peak = Math.max(1, ...recent.map(row => row.cases));
  const segments: string[][] = [];
  recent.forEach((row, i) => {
    if (!i || Date.parse(row.period_start) - Date.parse(recent[i-1].period_start) !== 7 * 86400000) segments.push([]);
    segments.at(-1)!.push(`${30 + (Date.parse(row.period_start)-first)/span*600},${175-row.cases/peak*145}`);
  });
  return <>
    <div className="screen-only"><Button disabled={history.loading || !!history.error} onClick={() => { flushSync(() => setGenerated(new Date().toISOString())); window.print(); }}>Print report</Button><p className="muted">Print or save as PDF: weekly historical report with dated estimates and source limitations.</p>{history.error && <p role="alert">Weekly print data unavailable. <Button onClick={history.retry}>Retry print data</Button></p>}</div>
    <article className="lgu-print-report" aria-label="LGU print report">
      <h1>{city.name} — historical LGU report</h1>
      <p>Generated: {generated}. {snapshot ? `Demo snapshot captured: ${snapshot}.` : "Published-data service read; not real-time surveillance."}</p>
      <SharedDisclaimer id="print-disclaimer-title" />
      <h2>Weekly observations and trend</h2>
      <p>Latest weekly source label: {latest ? formatDate(latest.period_start) : "Unavailable"}; cases: {latest?.cases ?? "Unavailable"}. {contiguous ? `Change from preceding weekly label: ${latest.cases - previous.cases} cases.` : "Preceding contiguous week unavailable; no change is inferred."}</p>
      <p>Weekly is the report's trend series. Monthly is derived from weekly; Manila daily is separate. No sources are added together. Observed values below include source flags; suspect rows are excluded from model fitting/scoring.</p>
      {recent.length > 0 && <figure><svg viewBox="0 0 660 210" role="img" aria-label="Recent weekly case trend; exact values in the following table"><title>Recent weekly cases; missing calendar weeks break the line</title><line x1="30" y1="175" x2="630" y2="175" stroke={colors.neutral[600]} />{segments.map((points,i) => <polyline key={i} points={points.join(" ")} fill="none" stroke={colors.navy[700]} strokeWidth="3" />)}</svg><figcaption>The latest reported week has {latest?.cases.toLocaleString("en-PH")} cases on {formatDate(latest?.period_start)}; gaps break the line.</figcaption></figure>}
      <table><thead><tr><th>Weekly label</th><th>Cases</th><th>Source flags</th></tr></thead><tbody>{recent.map(row => <tr key={row.id}><td>{row.period_start}</td><td>{row.cases}</td><td>{row.quality_flags.join(", ") || "None"}</td></tr>)}</tbody></table>
      <h2>Forecast estimates and intervals</h2>
      <p>Cached model: {cache.selected}; version {cache.metadata.version}. Forecast origin: {saved ? formatDate(saved.origin) : "Unavailable"}. A newer DB label does not update this cached forecast. Nominal intervals do not guarantee coverage.</p>
      <table><thead><tr><th>Ahead</th><th>Target label</th><th>Estimate</th><th>80% interval</th><th>95% interval</th><th>4-week mean estimate</th></tr></thead><tbody>{saved?.horizons.map(h => { const model = h.models.find(m => m.model === cache.selected), mean = h.models.find(m => m.model === "mean-4"); return <tr key={h.horizon}><td>{h.horizon} weeks</td><td>{h.target}</td><td>{value(model?.predicted)}</td><td>{model?.interval ? `${value(model.interval.low80)}–${value(model.interval.high80)}` : "Unavailable"}</td><td>{model?.interval ? `${value(model.interval.low95)}–${value(model.interval.high95)}` : "Unavailable"}</td><td>{value(mean?.predicted)}</td></tr>; })}</tbody></table>
      <h2>LGU model comparison versus four-week mean</h2>
      <table><thead><tr><th>Ahead</th><th>Model MAE</th><th>Mean MAE</th><th>MAE skill</th></tr></thead><tbody>{[1,2,4].map(horizon => { const rows = cache.summary.filter(s => s.city === city.name && s.horizon === horizon && s.cohort === "all-2019-onward"), model = rows.find(s => s.model === cache.selected), mean = rows.find(s => s.model === "mean-4"); return <tr key={horizon}><td>{horizon} weeks</td><td>{value(model?.mae)}</td><td>{value(mean?.mae)}</td><td>{model && mean ? value(skill(model.mae, mean.mae)) + "%" : "Unavailable"}</td></tr>; })}</tbody></table>
      <p>Paired walk-forward targets from 2019 onward; 2018 development selection. Positive MAE skill means lower error; negative means worse than the mean. Comparisons describe the cached historical test, not current performance.</p>
      <h2>Limitations</h2><ul><li>Weekly test evidence ends {cache.metadata.trainWindow.last}; no later-year evidence or current outbreak alert.</li><li>Missing/suspect lags remain unavailable, never zero. Deaths are excluded as predictors.</li><li>COVID 2020–2021 may distort reporting. Without those targets only 2019 remains; one-week interval coverage under-covers nominal levels.</li><li>sMAPE is worse than the mean baseline overall; short-horizon estimates are not season-level outbreak predictions.</li><li>Community reports are unverified, separate and excluded. Publication vintage dates are unavailable.</li></ul>
      <h2>Data Sources & Attribution</h2><p>Weekly source file: {cache.metadata.source}. SHA-256: {cache.metadata.checksum}. Backtest artifact generated: {cache.metadata.runAt}.</p><SourceCitation source="doh-epi-dengue-data-2016-2021.csv" />
      <p>Full source coverage and gaps: /data-sources. Review drafts: /legal. Model evidence: weekly-ridge-v1 cached backtest.</p>
    </article>
  </>;
}
