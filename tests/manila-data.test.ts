import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dailyWeeks, stitch, weekEnd, isoWeek } from '../scripts/lib/manila-data.ts';
import { loadDataset } from '../scripts/lib/historical.ts';
test('Sunday weeks, ISO year boundaries and leap days are deterministic in UTC',()=>{
 assert.equal(weekEnd('2020-02-29'),'2020-03-01'); assert.equal(weekEnd('2023-01-01'),'2023-01-01');
 assert.equal(isoWeek('2021-01-01'),'2020-W53');
});
test('Z explicitly imputes absence; M preserves missing; zero rows are observed',()=>{
 const rows=Array.from({length:14},(_,i)=>({period_start:`2023-01-${String(i+2).padStart(2,'0')}`,cases:i===0?0:2})).filter(r=>r.period_start!=='2023-01-04');
 const z=dailyWeeks(rows,'Z'),m=dailyWeeks(rows,'M');
 assert.equal(z[0].cases,10); assert.equal(z[0].days_with_rows,6);assert.ok(z[0].flags.includes('absent_dates_assumed_zero'));
 assert.equal(m[0].cases,null);assert.equal(m[0].reliable,false);assert.equal(m[1].cases,14);
 assert.throws(()=>dailyWeeks([...rows,rows[0]],'Z'),/Duplicate/);
 assert.throws(()=>dailyWeeks([{period_start:'2023-02-30',cases:1}],'Z'));
 assert.throws(()=>dailyWeeks([{period_start:'2023-01-01',cases:-1}],'Z'));
});
test('all-absent interior weeks differ from partial coverage; no assumption beyond source end',()=>{
 const rows=[{period_start:'2023-01-02',cases:1},{period_start:'2023-01-22',cases:2},{period_start:'2023-01-23',cases:3}];
 const z=dailyWeeks(rows,'Z'),m=dailyWeeks(rows,'M');
 assert.equal(z[1].cases,0);assert.equal(m[1].cases,null);
 assert.equal(z.at(-1)?.cases,null);assert.equal(z.at(-1)?.cases_recorded,3);
 assert.ok(z.at(-1)?.flags.includes('partial_boundary_week_excluded'));
});
test('real immutable sources: join, gaps, audit reconciliation, reproducible weekly sums',async()=>{
 const dataset=await loadDataset('data/raw');
 const z=stitch(dataset,'Z'),m=stitch(dataset,'M');
 assert.equal(z.length,413);assert.equal(m.length,413);
 assert.equal(z.find(r=>r.week_ending==='2016-11-13')?.cases,null);
 assert.equal(z.find(r=>r.week_ending==='2017-12-31')?.source,'doh-epi-dengue-data-2016-2021.csv');
 assert.equal(z.find(r=>r.week_ending==='2018-01-07')?.source,'Daily_Reported_Cases_of_Dengue_in_the_City_of_Manila_from_2018_to_2023.xlsx');
 assert.equal(z.filter(r=>r.days_with_rows!==null).reduce((s,r)=>s+(r.cases_recorded??0),0),14635);
 assert.equal(z.at(-1)?.cases,null);assert.equal(z.at(-1)?.cases_recorded,30);
 const artifact=JSON.parse(await readFile('data/processed/manila_weekly.json','utf8'));
 assert.deepEqual(artifact.scenarios,{Z:z,M:m});
 const audit=JSON.parse(await readFile('data/processed/audit.json','utf8'));
 assert.equal(audit.national.rows,32701);assert.equal(audit.daily.absentWithinCoverage.reduce((s:number,r:any)=>s+r.absent,0),252);
 assert.equal(audit.suppliedWeekly.matchesDaily,true);assert.equal(audit.reconciliation.n,156);
});
