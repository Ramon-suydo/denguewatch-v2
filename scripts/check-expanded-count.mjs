import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const data=JSON.parse(readFileSync('public/research/manila-expanded.json','utf8'));
assert.deepEqual(data,JSON.parse(readFileSync('data/processed/expanded-manila/evaluation.json','utf8')));
assert.equal(data.version,'manila-count-expanded-v1');
assert.equal(data.source_verified,false);
assert.equal(data.source_audit.raw_files.length,5);
assert.deepEqual(data.source_audit.geography_in_model,{single_city:false,pooled_transfer:true});
for(const [file,hash] of Object.entries(data.context_sha256)){
 assert.ok(['geographic_context.json','manila_weekly.json'].includes(file));
 assert.equal(createHash('sha256').update(readFileSync('data/processed/'+file)).digest('hex'),hash);
}
for(const source of data.source_audit.raw_files){
 assert.match(source.file,/^[A-Za-z0-9_.-]+\.(csv|xlsx)$/);
 const path='data/raw/'+source.file;
 if(existsSync(path))assert.equal(createHash('sha256').update(readFileSync(path)).digest('hex'),source.sha256,'Raw inputs changed: rerun the reviewed experiment.');
}
const recent=JSON.parse(readFileSync('public/live-manila/weekly.json','utf8')).rows;
assert.deepEqual(data.recent_input,recent.map(r=>({week_end:r.week_end,cases:r.weekly_new_cases,estimated:r.weekly_is_estimate})));
for(const h of data.horizons){
 assert.ok([1,2].includes(h.horizon));
 assert.equal(h.validation.length,12);assert.equal(h.test.length,12);
 const best=h.validation.reduce((a,b)=>a.mae<=b.mae?a:b);
 assert.equal(h.selected_by_validation,best.skill_percent>=5?best.model:'persistence');
 const selected=h.test.find(r=>r.model===h.selected_by_validation);
 const baseline=h.test.find(r=>r.model==='persistence');
 assert.equal(h.promotion_eligible,h.selected_by_validation!=='persistence'&&selected.skill_95[0]>0);
 const mae=h.test_records.reduce((sum,r)=>sum+Math.abs(r.actual-r.predicted),0)/h.test_records.length;
 assert.ok(Math.abs(mae-selected.mae)<1e-9);assert.equal(selected.n,h.test_records.length);
 assert.ok(h.test_records.every(r=>r.target.startsWith('2023')&&r.origin<r.target));
 assert.equal(selected.n,baseline.n);
 assert.ok(Number.isFinite(h.forecast.predicted)&&h.forecast.predicted>=0);
 if(h.forecast.model.includes('weather')||h.forecast.model.endsWith('all'))assert.equal(h.forecast.weather_complete,true,'Refresh complete delayed weather before publishing a weather-informed count.');
 assert.equal(h.forecast.origin,data.latest_week_end);
 assert.ok(h.unverified_2026_prequential.every(r=>r.origin<r.target));
}
console.log('PASS: expanded source fingerprints, artifact parity, validation selection and saved test calculations.');
