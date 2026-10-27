import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {artifactDigest,verifyProtectedArtifacts,type ProtectedFingerprint} from '../scripts/lib/protected-artifacts';
import {validateLiveRows,quantile,intervalStats,ratioPairs,buildLive,appendWeek,freshLive,type LiveData,type HistoricalWeek} from '../src/live-manila/model';
import {reportingHarness} from './support/reporting-harness';
const saved=JSON.parse(readFileSync('data/processed/manila_live_weekly.json','utf8')) as LiveData;
const history=JSON.parse(readFileSync('data/processed/manila_weekly.json','utf8')).scenarios.M as HistoricalWeek[];
const ends=saved.rows.map(r=>r.week_end),copy=()=>structuredClone(saved.rows);
test('live validation preserves all flags and differences and rejects invalid calendar, counts, gaps, flags and notes',()=>{
 assert.equal(validateLiveRows(copy(),ends).length,13);
 const mutations=[(r:any)=>{r.week_start='2026-02-30';},(r:any)=>{r.week_end='2026-10-24';},(r:any)=>{r.report_monday='2026-10-27';},(r:any)=>{delete r.weekly_is_estimate;},(r:any)=>{r.weekly_new_cases++;},(r:any)=>{r.total_since_jan1=0;},(r:any)=>{r.weekly_is_estimate=true;r.note='';},(r:any)=>{r.source_url='https://facebook.com.evil.invalid/posts/1';},(r:any)=>{r.evidence_file='docs/evidence/live-manila/../secret.png';}];
 for(const mutate of mutations){const rows=copy();mutate(rows[12]);assert.throws(()=>validateLiveRows(rows,ends));}
 assert.throws(()=>validateLiveRows(copy().filter((_,i)=>i!==3),ends));assert.throws(()=>validateLiveRows([...copy(),copy()[12]],ends));assert.throws(()=>validateLiveRows(copy()));
 for(let i=1;i<saved.rows.length;i++)assert.equal(saved.rows[i].weekly_new_cases,saved.rows[i].total_since_jan1-saved.rows[i-1].total_since_jan1);
 assert.equal(saved.rows.filter(r=>r.observed).length,4);assert.equal(saved.rows.filter(r=>r.total_is_estimate).length,6);assert.equal(saved.rows.filter(r=>r.weekly_is_estimate).length,9);
});
test('linear empirical interval matches a hand-computed fixture and excludes missing/non-calendar outcomes',()=>{
 const rows:HistoricalWeek[]=[100,200,100,300].map((cases,i)=>({cases,week_ending:['2019-01-06','2019-01-13','2019-01-20','2019-01-27'][i],reliable:true,calendar_days_in_coverage:7}));
 assert.equal(quantile([2,.5,3],.1),.8);assert.equal(quantile([2,.5,3],.5),2);assert.equal(quantile([2,.5,3],.9),2.8);
 assert.deepEqual(intervalStats(rows,1,100).quantiles,[.8,2,2.8]);assert.equal(ratioPairs(rows,1,100).length,3);
 assert.equal(ratioPairs(rows.map((r,i)=>i===1?{...r,cases:null}:r),1,100).length,1);assert.equal(ratioPairs(rows.map((r,i)=>i===1?{...r,calendar_days_in_coverage:6}:r),1,100).length,1);
});
test('leave-one-year-out coverage is measured on unseen years rather than fitted quantiles',()=>{
 const fixture:HistoricalWeek[]=[];for(const [year,ratio] of [[2017,1],[2018,2],[2019,3]])fixture.push({week_ending:`${year}-01-01`,cases:100,reliable:true,calendar_days_in_coverage:7},{week_ending:`${year}-01-08`,cases:100*ratio,reliable:true,calendar_days_in_coverage:7});
 const result=intervalStats(fixture,1,100);assert.equal(result.loyo.n,3);assert.equal(result.loyo.covered,1);assert.equal(result.loyo.coverage,1/3);assert.ok(result.loyo.folds.every(f=>f.train_n===2));
 assert.equal(intervalStats(history,1,100).loyo.coverage,29/40);assert.equal(intervalStats(history,2,100).loyo.coverage,32/42);
});
test('generated estimates, percentile, direction and sensitivity reproduce exactly without modifying historical data',()=>{
 const result=buildLive(saved.rows,history);assert.deepEqual(result.method,saved.method);assert.deepEqual(result.metadata,saved.metadata);
 const complete=history.filter(r=>r.reliable&&r.cases!==null&&r.calendar_days_in_coverage===7),latest=saved.rows.at(-1)!;
 assert.equal(result.method.percentile,100*complete.filter(r=>r.cases!<latest.weekly_new_cases).length/complete.length);assert.equal(result.method.historical_max,257);assert.equal(result.method.exceeds_historical_max,false);assert.equal(result.method.recent_peak,267);assert.equal(result.method.direction,'Steady');assert.equal(result.method.sensitivity.length,6);
 assert.deepEqual(result.method.ranges.map(r=>[r.low,r.high,r.n]),[[162,274,40],[150,305,42]]);
});
test('freshness uses exactly 14 days, rejects future and invalid weeks',()=>{assert.equal(freshLive('2026-10-25','2026-11-08'),true);assert.equal(freshLive('2026-10-25','2026-11-09'),false);assert.equal(freshLive('2026-10-25','2026-10-24'),false);assert.equal(freshLive('2026-02-30','2026-03-01'),false);});
test('an estimated latest week does not silently widen ranges, and zero-base relative direction is unavailable',()=>{
 const rows=copy();rows[12]={...rows[12],weekly_is_estimate:true,observed:false,note:'LOCAL TEST ONLY: estimated latest-week fixture'};assert.deepEqual(buildLive(rows,history).method.ranges,saved.method.ranges);
 const zero=copy().map(r=>({...r,weekly_new_cases:0,observed:true,weekly_is_estimate:false}));assert.equal(buildLive(zero,history).method.direction,'Unavailable');
});
test('append computes a single calendar difference, requires source, carries estimated uncertainty and never spreads a multiweek anchor',()=>{
 const prior=copy().slice(0,12),next=appendWeek(prior,{total:4274,report:'2026-10-26',url:'https://www.facebook.com/fixture-only/posts/13',estimated:false,note:''}).at(-1)!;
 assert.equal(next.weekly_new_cases,226);assert.equal(next.observed,true);
 assert.throws(()=>appendWeek(prior,{total:4274,report:'2026-11-02',url:next.source_url!,estimated:false,note:''}));
 const estimated=copy().slice(0,10);assert.throws(()=>appendWeek(estimated,{total:3822,report:'2026-10-12',url:'',estimated:false,note:''}));
 const changed=appendWeek(estimated,{total:3822,report:'2026-10-12',url:next.source_url!,estimated:true,note:'LOCAL TEST ONLY: interpolation fixture'}).at(-1)!;assert.equal(changed.weekly_new_cases,267);assert.equal(changed.observed,false);
});
test('2026 cannot leak into byte-identical historical, training, evaluation and exported model artifacts',()=>{
 const hashes=JSON.parse(readFileSync('data/live-manila/protected-canonical.json','utf8')).files as Record<string,ProtectedFingerprint>;
 assert.equal(verifyProtectedArtifacts(hashes),121);
 for(const name of ['data/processed/manila_weekly.json','data/processed/ml/training.json','data/processed/ml/evaluation.json','public/ml/history.json','public/ml/replay.json'])assert.ok(!readFileSync(name,'utf8').includes('2026-10-25'),name+' contains live rows');
 const publicData=JSON.parse(readFileSync('public/live-manila/weekly.json','utf8'));assert.deepEqual(publicData.method,saved.method);assert.ok(publicData.rows.every((r:any)=>!('evidence_file' in r)));
});
test('portable fingerprints allow only existing Git text checkout EOL conversion and preserve raw source bytes',()=>{
 const files=JSON.parse(readFileSync('data/live-manila/protected-canonical.json','utf8')).files as Record<string,ProtectedFingerprint>;
 const path='public/ml/replay.json',record=files[path],lf=Buffer.from(readFileSync(path).toString('latin1').replace(/\r\n/g,'\n'),'latin1'),crlf=Buffer.from(lf.toString('latin1').replace(/\n/g,'\r\n'),'latin1');
 assert.equal(record.git_text_eol,true);assert.equal(artifactDigest(lf,true),record.sha256);assert.equal(artifactDigest(crlf,true),record.sha256);
 const raw='data/raw/doh-epi-dengue-data-2016-2021.csv',rawRecord=files[raw],bytes=readFileSync(raw);assert.equal(rawRecord.git_text_eol,false);assert.equal(artifactDigest(bytes,false),rawRecord.sha256);
 assert.notEqual(artifactDigest(Buffer.from(bytes.toString('latin1').replace(/\r\n/g,'\n'),'latin1'),false),rawRecord.sha256);
});
test('real SQL enforces AAL2, legacy immutability, append validation, optimistic parent, audit and rollback without public evidence paths',async()=>{
 const local=await reportingHarness('admin');try{const db=local.db;
 // LOCAL TEST ONLY: shorten the actual seed by one week so the append is a completed past week, never a future observation.
 const prior=copy().slice(0,12);await db.query('update private.manila_live_seed set rows=$1::jsonb',[JSON.stringify(prior)]);
 const batch=appendWeek(prior,{total:4274,report:'2026-10-26',url:'https://www.facebook.com/fixture-only/posts/13',estimated:false,note:'',evidence:'docs/evidence/live-manila/local-fixture.png'});
 async function role(aal='aal2'){await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",['00000000-0000-4000-8000-000000000099']);await db.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify({aal,role:'authenticated'})]);await db.exec('set role authenticated');}
 const stage=async(rows=saved.rows)=>(await db.query<{id:string}>('select public.stage_manila_live_upload($1::jsonb,null) id',[JSON.stringify(rows)])).rows[0].id;
 await role('aal1');await assert.rejects(stage(batch));await role();
 for(const mutate of [(r:any)=>{r[0].weekly_new_cases++;},(r:any)=>{r[12].total_since_jan1=1;},(r:any)=>{r[12].source_url=null;},(r:any)=>{delete r[12].weekly_is_estimate;},(r:any)=>{r[12].week_end='2026-10-24';},(r:any)=>{r[12].report_monday='2099-01-01';},(r:any)=>{r[12].weekly_is_estimate=true;r[12].observed=false;r[12].note='';}]){const invalid=structuredClone(batch);mutate(invalid);await assert.rejects(stage(invalid));}
 const one=await stage(batch),two=await stage(batch);const status=(id:string,s:string)=>db.query('select public.set_manila_live_upload_status($1,$2)',[id,s]);await status(one,'published');await assert.rejects(status(two,'published'));await assert.rejects(db.query("update public.manila_live_uploads set status='published'"));
 await db.exec('reset role;set role anon');await assert.rejects(stage(batch));await assert.rejects(db.query('select * from public.manila_live_uploads'));await assert.rejects(db.query('select * from private.manila_live_seed'));
 const publicVersion=(await db.query<{v:{id:string;data:LiveData;created_by?:string}}>('select public.published_manila_live_input() v')).rows[0].v;assert.equal(publicVersion.id,one);assert.equal(publicVersion.created_by,undefined);assert.ok(publicVersion.data.rows.every(r=>!('evidence_file' in r)));const expected=buildLive(batch,history);assert.deepEqual(publicVersion.data.method.ranges,expected.method.ranges);assert.equal(publicVersion.data.method.direction,expected.method.direction);assert.ok(Math.abs(publicVersion.data.method.percentile-expected.method.percentile)<1e-10);assert.deepEqual(publicVersion.data.method.sensitivity,expected.method.sensitivity);assert.deepEqual(publicVersion.data.metadata,expected.metadata);
 await role();await status(one,'rolled_back');await assert.rejects(status(one,'published'));assert.equal((await db.query<{v:null}>('select public.published_manila_live_input() v')).rows[0].v,null);
 await db.exec('reset role');assert.equal((await db.query<{n:number}>("select count(*)::integer n from public.staff_audit where action like '%manila_live%'")).rows[0].n,4);
 }finally{await local.close();}
});
test('real SQL restores the previous published projection and rejects rolling back an older ancestor',async()=>{
 const local=await reportingHarness('admin');try{const db=local.db,seed=copy().slice(0,11);await db.query('update private.manila_live_seed set rows=$1::jsonb',[JSON.stringify(seed)]);
 const first=appendWeek(seed,{total:4048,report:'2026-10-19',url:'https://www.facebook.com/fixture-only/posts/12',estimated:false,note:''}),second=appendWeek(first,{total:4274,report:'2026-10-26',url:'https://www.facebook.com/fixture-only/posts/13',estimated:false,note:''});
 await db.query("select set_config('request.jwt.claim.sub',$1,false)",['00000000-0000-4000-8000-000000000099']);await db.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify({aal:'aal2',role:'authenticated'})]);await db.exec('set role authenticated');
 const stage=async(rows:typeof seed,parent:string|null)=>(await db.query<{id:string}>('select public.stage_manila_live_upload($1::jsonb,$2) id',[JSON.stringify(rows),parent])).rows[0].id;
 const status=(id:string,s:string)=>db.query('select public.set_manila_live_upload_status($1,$2)',[id,s]);const one=await stage(first,null);await status(one,'published');const two=await stage(second,one);await status(two,'published');await assert.rejects(status(one,'rolled_back'));await status(two,'rolled_back');
 const restored=(await db.query<{v:{id:string;data:LiveData}}>('select public.published_manila_live_input() v')).rows[0].v;assert.equal(restored.id,one);assert.equal(restored.data.metadata.row_count,12);assert.equal(restored.data.metadata.last_week_end,'2026-10-18');assert.deepEqual(restored.data.method.ranges,buildLive(first,history).method.ranges);await status(one,'rolled_back');assert.equal((await db.query<{v:null}>('select public.published_manila_live_input() v')).rows[0].v,null);
 }finally{await local.close();}
});
