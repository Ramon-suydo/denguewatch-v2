import { readFile,writeFile,mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { geoMercator,geoPath } from 'd3-geo';
import { rewindForD3, type Boundary } from './geometry-qa.ts';
import { normalizeLgu } from './lib/geography.ts';
import { endemic, type Model, type Result } from './lib/manila-model.ts';
import type { ManilaWeek } from './lib/manila-data.ts';
const evaluation=JSON.parse(await readFile('data/processed/evaluation.json','utf8'));
const manila=JSON.parse(await readFile('data/processed/manila_weekly.json','utf8'));
const ncr=JSON.parse(await readFile('data/processed/ncr_weekly.json','utf8'));
const populations=JSON.parse(await readFile('data/processed/ncr_population.json','utf8'));
const geometry=JSON.parse(await readFile('data/geo/ncr-boundaries.geojson','utf8'));
const source=JSON.parse(await readFile('data/geo/ncr-source.json','utf8'));
for(const f of geometry.features)rewindForD3(f as Boundary);
const projection=geoMercator().fitExtent([[18,18],[702,502]],geometry),path=geoPath(projection).digits(2);
const shapes=geometry.features.map((f:any)=>({city:normalizeLgu(f.properties.adm3_name),path:path(f),center:path.centroid(f)}));
assert.equal(shapes.length,17);assert.equal(new Set(shapes.map((s:any)=>s.city)).size,17);
// Persistence is the conservative public default: the held-out one/two-week ridge
// gains do not have positive lower confidence bounds. The frozen 2017 candidate
// remains reported, never relabelled as a baseline win. This promotion decision
// is explicitly post-evaluation and not claimed as preregistered selection.
const snapshots=['Z','M'].map(scenario=>{
 const rows=manila.scenarios[scenario] as ManilaWeek[],series=new Map(rows.filter(r=>r.cases!==null).map(r=>[r.week_ending,r.cases!]));
 const latest=evaluation.latest.filter((r:any)=>r.scenario===scenario&&r.model==='naive');
 const last=rows.filter(r=>r.cases!==null&&r.reliable).at(-1)!,channel=endemic(series,last.week_ending,last.week_ending);
 return {scenario,as_of:last.week_ending,source:last.source,current_risk:{level:'Insufficient current data',reason:`The latest reliable ${scenario==='Z'?'zero-assumed':'complete-row'} week ends ${last.week_ending}; these historical records cannot establish current risk.`,historical_threshold:channel?.threshold??null,historical_level:channel&&last.cases!>channel.threshold?'Above research threshold':'At or below research threshold',threshold_reference_n:channel?.n??0},model:'naive' as Model,model_version:'manila-persistence-v2',promotion_note:'Conservative public baseline after inconclusive held-out 1/2-week ridge gains; frozen 2017 ridge candidate still reported. Post-evaluation deployment decision, not preregistered.',forecasts:latest,quality_flags:last.flags,channel:rows.map(row=>({week_ending:row.week_ending,...endemic(new Map([...series].filter(([d])=>d<row.week_ending)),row.week_ending,row.week_ending)})),year_comparison:Array.from({length:8},(_,i)=>2016+i).map(year=>{const group=rows.filter(r=>r.week_ending.startsWith(String(year)));return {year,observed_week_count:group.filter(r=>r.cases!==null).length,calendar_week_count:group.length,scorable_cases:group.reduce((s,r)=>s+(r.cases??0),0),complete:group.every(r=>r.cases!==null),source:[...new Set(group.map(r=>r.source))]};})};
});
await mkdir('public/api/v2',{recursive:true});await mkdir('public/geo',{recursive:true});
await writeFile('public/api/v2/manila.json',JSON.stringify({version:2,data_as_of:'2023-12-02',historical_only:true,community_included:false,snapshots,series:manila.scenarios,metadata:evaluation.metadata,selection:evaluation.selection,summaries:evaluation.summaries})+'\n');
await writeFile('public/api/v2/ncr.json',JSON.stringify({version:2,data_as_of:'2021-01-10',banner:'Data ends January 2021',historical_only:true,populations,rows:ncr,shapes,boundary_source:source})+'\n');
// Build a compact plot-ready test sequence. No raw community information is read.
const predictions=(evaluation.evidence as Result[]).filter(r=>r.model==='naive'&&r.target>='2018-01-01');
await writeFile('public/api/v2/backtest.json',JSON.stringify({version:2,rows:predictions})+'\n');
console.log('Published read-only Manila, NCR and backtest JSON endpoints; no community records or hosted writes.');
