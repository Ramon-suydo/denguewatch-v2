import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { parse } from 'csv-parse/sync';
import { loadDataset, SOURCES, type Dataset, type Observation } from './historical.ts';
export const DAY = 86400000;
export const shiftDay = (date: string, days: number) => new Date(Date.parse(date + 'T00:00:00Z') + days * DAY).toISOString().slice(0,10);
export const weekEnd = (date: string) => shiftDay(date, (7 - new Date(date + 'T00:00:00Z').getUTCDay()) % 7);
export function isoWeek(date: string) {
 const d = new Date(date + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
 return `${d.getUTCFullYear()}-W${String(Math.ceil(((+d - Date.UTC(d.getUTCFullYear(),0,1))/DAY + 1)/7)).padStart(2,'0')}`;
}
export type ManilaWeek = { week_ending: string; week_start: string; epi_week: string; source: string; scenario: 'Z'|'M'; cases: number|null; cases_recorded: number|null; days_with_rows: number|null; calendar_days_in_coverage: number; reliable: boolean; flags: string[] };
export function dailyWeeks(rows: Pick<Observation,'period_start'|'cases'>[], scenario: 'Z'|'M'): ManilaWeek[] {
 assert.ok(rows.length, 'Daily series is empty');
 const sorted = [...rows].sort((a,b)=>a.period_start.localeCompare(b.period_start));
 const known = new Map<string,number>();
 for (const row of sorted) {
  assert.match(row.period_start,/^\d{4}-\d{2}-\d{2}$/);
  assert.equal(new Date(row.period_start+'T00:00:00Z').toISOString().slice(0,10),row.period_start);
  assert.ok(Number.isSafeInteger(row.cases)&&row.cases>=0); assert.ok(!known.has(row.period_start),'Duplicate daily date');
  known.set(row.period_start,row.cases);
 }
 const first = sorted[0].period_start, last = sorted.at(-1)!.period_start, result: ManilaWeek[] = [];
 for(let end=weekEnd(first);end<=weekEnd(last);end=shiftDay(end,7)) {
  const dates=Array.from({length:7},(_,i)=>shiftDay(end,i-6));
  const observed=dates.filter(d=>known.has(d)); const coverage=dates.filter(d=>d>=first&&d<=last).length;
  const recorded=observed.reduce((s,d)=>s+known.get(d)!,0), complete=observed.length===7;
  result.push({week_ending:end,week_start:shiftDay(end,-6),epi_week:isoWeek(shiftDay(end,-6)),source:SOURCES.day,scenario,
   cases:coverage<7?null:scenario==='M'&&!complete?null:recorded,cases_recorded:recorded,days_with_rows:observed.length,calendar_days_in_coverage:coverage,
   reliable:coverage===7&&(scenario==='Z'||complete),flags:[...(observed.length<7?['absent_dates_unconfirmed']:[]),...(scenario==='Z'&&observed.length<7?['absent_dates_assumed_zero']:[]),...(coverage<7?['partial_boundary_week_excluded']:[])]});
 }
 return result;
}
export function stitch(dataset: Dataset, scenario: 'Z'|'M'): ManilaWeek[] {
 const doh=dataset.observations.filter(r=>r.period_type==='week'&&r.lgu_name==='MANILA CITY'&&r.period_start<'2018-01-01');
 const byDate=new Map(doh.map(r=>[r.period_start,r])); const start=doh.map(r=>r.period_start).sort()[0];
 const early:ManilaWeek[]=[];
 for(let date=start;date<'2018-01-01';date=shiftDay(date,7)) {
  const row=byDate.get(date);
  early.push({week_ending:date,week_start:shiftDay(date,-6),epi_week:isoWeek(shiftDay(date,-6)),source:SOURCES.week,scenario,cases:row?.cases??null,cases_recorded:row?.cases??null,days_with_rows:null,calendar_days_in_coverage:7,reliable:!!row&&!row.quality_flags.includes('deaths_exceed_cases'),flags:['source_sunday_assumed_week_end_unconfirmed',...(row?.quality_flags??['missing_source_week'])]});
 }
 // Death anomalies are quality flags only; do not silently rewrite the case series.
 for(const row of early) if(!row.reliable) row.cases=null;
 return [...early,...dailyWeeks(dataset.observations.filter(r=>r.period_type==='day'),scenario)];
}
export function reconciliation(daily: ManilaWeek[], weekly: Observation[]) {
 const map=new Map(weekly.map(r=>[r.period_start,r.cases]));
 const pairs=daily.filter(r=>r.calendar_days_in_coverage===7&&map.has(r.week_ending)).map(r=>({date:r.week_ending,daily:r.cases_recorded!,doh:map.get(r.week_ending)!}));
 const mean=(v:number[])=>v.reduce((a,b)=>a+b,0)/v.length;
 const x=mean(pairs.map(r=>r.daily)),y=mean(pairs.map(r=>r.doh));
 const correlation=pairs.reduce((s,r)=>s+(r.daily-x)*(r.doh-y),0)/Math.sqrt(pairs.reduce((s,r)=>s+(r.daily-x)**2,0)*pairs.reduce((s,r)=>s+(r.doh-y)**2,0));
 return {n:pairs.length,dailyTotal:pairs.reduce((s,r)=>s+r.daily,0),dohTotal:pairs.reduce((s,r)=>s+r.doh,0),mae:mean(pairs.map(r=>Math.abs(r.daily-r.doh))),maxDifference:Math.max(...pairs.map(r=>Math.abs(r.daily-r.doh))),correlation,pairs};
}
export async function prepareManila() {
 const dataset=await loadDataset('data/raw');
 const daily=dataset.observations.filter(r=>r.period_type==='day'),last=daily.map(r=>r.period_start).sort().at(-1)!;
 const manila={version:'manila-weekly-v2',join_date:'2018-01-01',date_semantics:'ISO epi_week uses the Monday start; DOH Sunday labels are operationally assumed week-ending, not confirmed source metadata.',scenarios:{Z:stitch(dataset,'Z'),M:stitch(dataset,'M')}};
 const ncr=dataset.observations.filter(r=>r.period_type==='week').map(r=>({city:r.lgu_name,week_ending:r.period_start,cases:r.cases,deaths:r.deaths,flags:r.quality_flags,source:r.source}));
 const populations=dataset.lgus.map(r=>({city:r.name,population_2020:r.population,source:SOURCES.month,status:'unverified; confirm against PSA 2020 census'}));
 const bytes=await Promise.all(Object.values(SOURCES).map(async name=>({name,sha256:createHash('sha256').update(await readFile('data/raw/'+name)).digest('hex')})));
 const national=parse(await readFile('data/raw/'+SOURCES.week),{columns:true,skip_empty_lines:true,trim:true}) as Record<string,string>[];
 const scopeDaily=dailyWeeks(daily,'Z');
 let suppliedWeekly:unknown={status:'not supplied'};
 try {
  const content=await readFile('data/raw/Manila_weekly_MHD_2018_2023.csv');
  const rows=parse(content,{columns:true,skip_empty_lines:true}) as Record<string,string>[];
  assert.deepEqual(Object.keys(rows[0]),['week_ending','week_start','cases_reported','days_reported','complete_week']);
  for(const row of rows) {
   const derived=scopeDaily.find(r=>r.week_ending===row.week_ending);
   assert.ok(derived,'Unknown supplied week'); assert.equal(row.week_start,derived.week_start);
   assert.equal(Number(row.days_reported),derived.days_with_rows);
   assert.equal(row.complete_week,String(derived.days_with_rows===7?'True':'False'));
   assert.equal(row.cases_reported===''?null:Number(row.cases_reported),derived.days_with_rows===0?null:derived.cases_recorded);
  }
  suppliedWeekly={rows:rows.length,blank:rows.filter(r=>r.days_reported==='0').length,fewerThanSeven:rows.filter(r=>Number(r.days_reported)<7).length,last:rows.at(-1)?.week_ending,sha256:createHash('sha256').update(content).digest('hex'),matchesDaily:true,omittedFinalWeek:scopeDaily.at(-1)};
 } catch(error) {if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
 const files=await readdir('data/raw');
 const geo=await Promise.all((await readdir('data/geo')).map(async name=>{
  const buffer=await readFile('data/geo/'+name); let shape:unknown=null;
  if(name.endsWith('.geojson')) {const data=JSON.parse(buffer.toString());shape={features:data.features.length,geometryTypes:[...new Set(data.features.map((f:any)=>f.geometry.type))],properties:Object.keys(data.features[0].properties)};}
  return {name,bytes:buffer.length,sha256:createHash('sha256').update(buffer).digest('hex'),shape};
 }));
 const report={version:2,sourceFiles:bytes,national:{rows:national.length-1,hxlRows:1,locations:new Set(national.slice(1).map(r=>r.loc)).size,regions:new Set(national.slice(1).map(r=>r.Region)).size},audit:dataset.audit,
  daily:{rows:daily.length,zeroRows:daily.filter(r=>r.cases===0).length,last,absentWithinCoverage:dataset.audit.dailyYears.map(r=>({year:r.year,absent:r.missing_dates.filter(d=>d<=last).length})),outsideCoverage:29},suppliedWeekly,duplicateWeeklyPresent:files.includes('Manila_weekly_MHD_2018_2023_1.csv'),
  reconciliation:reconciliation(scopeDaily,dataset.observations.filter(r=>r.period_type==='week'&&r.lgu_name==='MANILA CITY')),geo};
 await mkdir('data/processed',{recursive:true}); await mkdir('.artifacts',{recursive:true});
 for(const [name,data] of Object.entries({manila_weekly:manila,ncr_weekly:ncr,ncr_population:populations,audit:report}))await writeFile(`data/processed/${name}.json`,JSON.stringify(data,null,2)+'\n');
 // Weather is generated only after an authenticated provenance/coverage check by fetch_weather.ts.
 const md=`# Validation report\n\nGenerated with npm run data:prepare; no database writes.\n\n- Source checksums: ${bytes.map(r=>r.name+': '+r.sha256).join('; ')}\n- Nationwide data rows: ${report.national.rows}; one HXL metadata row excluded.\n- NCR: ${ncr.length} rows, ${populations.length} LGUs; three internal gaps per LGU remain missing.\n- Daily: ${daily.length} positive rows; 252 absent dates inside coverage; 29 dates after the final source date are outside coverage.\n- Stitched weeks per scenario: ${manila.scenarios.Z.length}; source changes on 2018-01-01.\n- Complete boundary weeks only; final partial week retained for audit, excluded from forecasts/scoring.\n- Duplicate weekly _1.csv present: ${report.duplicateWeeklyPresent}. Raw files untouched.\n- Reconciliation: ${report.reconciliation.n} paired weeks; daily ${report.reconciliation.dailyTotal}, DOH ${report.reconciliation.dohTotal}; MAE ${report.reconciliation.mae.toFixed(4)}, correlation ${report.reconciliation.correlation.toFixed(6)}, maximum difference ${report.reconciliation.maxDifference}.\n- Operational DOH Sunday-week-ending interpretation remains unconfirmed.\n- See data/processed/audit.json for nulls, gaps, anomalies, schemas and fingerprints.\n`;
 await writeFile('data/validation_report.md',md);
 console.log(md); return {manila,report};
}
