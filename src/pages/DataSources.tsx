import { Link } from "react-router-dom";
import { Card } from "../components/ui";
import { StatCard } from "../components/StatCard";
import { PageHeader } from "../components/PageHeader";
import { SourceCitation } from "../components/SourceCitation";
import { pendingCitationFields } from "../lib/source-metadata";
import { loadDemoSnapshot } from "../lib/demo-snapshot";
import { useResource } from "../lib/resources";
import { ReadState } from "../components/PageState";
import { dataConfidence, coverageSegments } from "../lib/data-confidence";
import { formatDate } from "../lib/dates";
import cache from "../data/weekly-forecast-v1.json";
export function DataSources() {
 const snapshot=useResource("confidence-audit",loadDemoSnapshot);
 return <><PageHeader eyebrow="PUBLISHED DATA, CHECKED" title="Data confidence" description="Trace Manila’s records from source files to charts and tested estimates." />
 <div className="ui-container app-content content-stack"><ReadState resource={snapshot}>{data=>{
  const audit=dataConfidence(data), weekly=audit.sources.find(source=>source.period==="week")!, daily=audit.sources.find(source=>source.period==="day")!;
  const score=cache.summary.find(row=>row.city==="MANILA CITY"&&row.horizon===1&&row.cohort==="all-2019-onward"&&row.model===cache.selected)!;
  const baseline=cache.summary.find(row=>row.city==="MANILA CITY"&&row.horizon===1&&row.cohort==="all-2019-onward"&&row.model==="mean-4")!;
  const first=Date.parse(weekly.first), last=Date.parse(daily.last)+86400000, x=(date:string)=>(Date.parse(date)-first)/(last-first)*100;
  return <>
   <section aria-labelledby="verified-work-title"><div className="section-heading"><h2 id="verified-work-title">Verified work, visible evidence</h2></div>
    <p>Audit snapshot: {formatDate(data.metadata.createdAt)}. These figures describe checked records, not live conditions or unique cases.</p>
    <div className="stat-grid">
     <StatCard label="Manila rows audited" value={audit.rows.length.toLocaleString("en-PH")} detail="Weekly, derived monthly and separate daily records; case totals are never added across sources." />
     <StatCard label="Full-row verification" value={audit.verification?"Matched":"Not established"} detail="Snapshot verification compares every official row with audited source files." />
     <StatCard label="Years represented" value={`${audit.firstYear}–${audit.lastYear}`} detail="Source labels with gaps and partial periods preserved." />
     <StatCard label="Latest data period" value={formatDate(audit.latest)} detail="Historical source label, not a real-time update." />
    </div>
   </section>
   <Card><h2>Manila coverage</h2><p className="chart-takeaway">Weekly records span {formatDate(weekly.first)} to {formatDate(weekly.last)}; the separate daily series extends to {formatDate(daily.last)}.</p>
    <div className="coverage-timeline" role="img" aria-label="Manila weekly and daily coverage; hatched segments mark not-reported dates within each source’s first and last labels.">
     {[weekly,daily].map(source=><div className="coverage-row" key={source.source}><strong>{source.period==="week"?"Weekly":"Daily"}</strong><div className="coverage-track">{coverageSegments(source.rows.map(row=>row.period_start),source.period==="week"?7:1).map(segment=><span key={segment.date} className={segment.reported?"coverage-present":"coverage-gap"} style={{left:`${x(segment.date)}%`,width:`${x(segment.end)-x(segment.date)}%`}} title={`${segment.reported?"Reported":"Not reported"}: ${segment.date} to ${segment.end} (end exclusive)`}/>)}</div><span>{source.first.slice(0,4)}–{source.last.slice(0,4)}</span></div>)}
    </div>
    <p className="inline-info">ⓘ Hatching means not reported, never zero; blank track lies outside that source’s coverage. Exact dates and counts follow.</p>
    <div className="table-scroll" role="region" aria-label="Manila source coverage" tabIndex={0}><table><thead><tr><th>Records</th><th>First label</th><th>Last label</th><th>Rows</th></tr></thead><tbody>{audit.sources.map(source=><tr key={source.source}><th>{source.period==="week"?"Weekly":source.period==="day"?"Manila daily":"Monthly (derived from weekly)"}</th><td>{formatDate(source.first)}</td><td>{formatDate(source.last)}</td><td>{source.rows.length.toLocaleString("en-PH")}</td></tr>)}</tbody></table></div>
   </Card>
   <Card><h2>Tested against a simple baseline</h2><p>Manila’s one-week test MAE: {score.mae?.toFixed(2)} cases for {cache.selected}, compared with {baseline.mae?.toFixed(2)} for the 4-week mean. Backtesting uses past-only training, not random splits.</p><Link className="text-link" to="/#model-transparency-title">Read the model evidence and limits</Link></Card>
   <Card className="prose"><details className="data-notes"><summary>Data notes · 5 notes</summary><ol>
    <li><strong>Historical, not live.</strong> Weekly labels cover {formatDate(weekly.first)}–{formatDate(weekly.last)}; daily dates cover {formatDate(daily.first)}–{formatDate(daily.last)}. Weekly start/end semantics are unconfirmed, partial months stay partial, and monthly records are derived from weekly, not independent evidence.</li>
    <li><strong>Missing is not zero.</strong> A missing row stays “Not reported”; an explicit zero stays “Reported zero”. Fixed 2020 incidence denominators verify arithmetic, not current population or matching historical boundaries.</li>
    <li><strong>Two separate Manila series.</strong> Reported daily versus weekly case totals: {audit.overlaps.map(row=>`${row.year}: ${row.day.toLocaleString("en-PH")} vs ${row.week.toLocaleString("en-PH")}`).join("; ")}. Differences in coverage or definitions remain unconfirmed; never add or silently reconcile the sources.</li>
    <li><strong>Deaths excluded from forecasts.</strong> {audit.rows.filter(row=>row.deaths!==null&&row.deaths>row.cases).length} Manila rows with deaths exceeding cases are preserved and flagged, excluded from mortality claims and forecast validation. Daily deaths are unavailable (NULL); large case peaks alone are not errors.</li>
    <li><strong>Community reports are unverified.</strong> They stay separate from official data and forecasts, with submissions closed. Counts below five are hidden; any displayed counts are lower bounds.</li>
   </ol></details></Card>
   <Card className="prose"><h2>{pendingCitationFields().length?"Source attribution awaiting review":"Source attribution"}</h2><p>DOH/FOI citation fields still require source-owner review where marked unavailable, unconfirmed or pending. This is a research application, not an official DOH service.</p>{audit.sources.map(source=><section key={source.source}><h3>{source.period==="day"?"Manila daily":source.period==="week"?"Manila weekly":"Manila monthly (derived)"}</h3><SourceCitation source={source.source}/><details><summary>Source checksum (SHA-256)</summary><code className="checksum">{data.metadata.sourceChecksums.find(item=>item.source===source.source)?.sha256??"Unavailable"}</code></details></section>)}</Card>
  </>;
 }}</ReadState></div></>;
}
