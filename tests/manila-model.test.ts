import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advance,fitAt,calibrate,endemic,metrics,bootstrapSkill,auc,featureVector,type Result } from '../scripts/lib/manila-model.ts';
const series=new Map(Array.from({length:180},(_,i)=>[advance('2016-01-03',i),10+i%17]));
test('fitters cannot see future targets, scalers, tree splits or weather',()=>{
 const origin=advance('2016-01-03',150),future=new Map(series);
 for(const [date] of future)if(date>origin)future.set(date,1000000);
 for(const model of ['naive','mean-4','seasonal-naive','endemic-channel','ridge-cases','tree-cases'] as const) {
  assert.deepEqual(fitAt(series,new Map(),origin,2,model),fitAt(future,new Map(),origin,2,model));
  assert.ok(fitAt(series,new Map(),origin,2,model)!.trainEnd<=origin);
 }
});
test('exact calendar lags are required and demographics are not features',()=>{
 const origin=advance('2016-01-03',150),gapped=new Map(series);gapped.delete(advance(origin,-2));
 assert.equal(fitAt(gapped,new Map(),origin,1,'ridge-cases'),null);
 assert.equal(fitAt(gapped,new Map(),origin,1,'mean-4'),null);
 const f=featureVector(series,new Map(),origin,2,'cases')!;
 assert.ok(!f.names.some(s=>/population|density|city/.test(s)));
 assert.equal(featureVector(series,new Map(),origin,2,'weather'),null);
});
test('threshold uses previous years and cannot depend on the future target count',()=>{
 const origin=advance('2016-01-03',150),target=advance(origin,2),altered=new Map(series);altered.set(target,999999);
 assert.deepEqual(endemic(series,target,origin),endemic(altered,target,origin));
});
test('calibration waits for outcomes to mature; undefined classification stays unavailable',()=>{
 const previous=Array.from({length:25},(_,i)=>({target:advance('2016-01-03',i),actual:20,predicted:10})) as Result[];
 assert.equal(calibrate(previous,'2016-02-01',5,10,5).low80,null);
 const a=calibrate(previous,'2017-01-01',5,10,5);
 assert.equal(a.low80,0);assert.equal(a.high80,15);
 const poisoned=[...previous,{target:'2099-01-01',actual:999999,predicted:0}] as Result[];
 assert.deepEqual(a,calibrate(poisoned,'2017-01-01',5,10,5));
 assert.equal(auc([{actual:true,p:.2}]),null);assert.equal(metrics([]).mae,null);assert.equal(metrics([]).precision,null);
});
test('MASE, interval coverage, tied AUC and seeded paired bootstrap are verifiable',()=>{
 const rows=Array.from({length:20},(_,i)=>({actual:i%2?10:20,predicted:i%2?12:18,naive:15,scale:2,low80:9,high80:21,threshold:15,alertProbability:i%2?.1:.9,horizon:2})) as Result[];
 const m=metrics(rows);assert.equal(m.mae,2);assert.equal(m.rmse,2);assert.equal(m.mase,1);assert.equal(m.skillPercent,60);assert.equal(m.coverage80,1);assert.equal(m.rocAuc,1);assert.equal(m.falseAlarmRate,0);assert.equal(m.meanLeadWeeks,2);
 assert.equal(auc([{actual:true,p:.5},{actual:false,p:.5}]),.5);
 assert.deepEqual(bootstrapSkill(rows),bootstrapSkill(rows));
});
