import { readFile,writeFile,mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { prepareManila, type ManilaWeek } from './lib/manila-data.ts';
import { MODELS,fitAt,advance,mean,endemic,calibrate,metrics,bootstrapSkill,type Model,type Result,type Weather } from './lib/manila-model.ts';
const {manila}=await prepareManila();
const weatherBytes=await readFile('data/processed/weather_weekly.json');
const weatherData=JSON.parse(weatherBytes.toString());
const weather=new Map<string,Weather>(weatherData.rows.map((r:Weather)=>[r.week_ending,r]));
const evidence:Result[]=[],exclusions:Record<string,number>={};
const latest:unknown[]=[];
function run(rows:ManilaWeek[],scenario:string,models:readonly Model[]) {
 const series=new Map(rows.filter(r=>r.cases!==null).map(r=>[r.week_ending,r.cases!]));
 const histories=new Map<string,Result[]>();let count=0;
 for(const origin of rows.map(r=>r.week_ending).filter(d=>d>='2017-01-01'&&d<='2023-11-26')) for(const horizon of [1,2,4]) {
  const target=advance(origin,horizon),actual=series.get(target),current=series.get(origin);
  if(actual===undefined||current===undefined){exclusions[scenario+':missing-target-or-origin']=(exclusions[scenario+':missing-target-or-origin']??0)+1;continue;}
  const fits=models.map(model=>fitAt(series,weather,origin,horizon,model));
  if(fits.some(f=>!f||!Number.isFinite(f.predicted))){exclusions[scenario+':common-support-lag-or-training']=(exclusions[scenario+':common-support-lag-or-training']??0)+1;continue;}
  const past=new Map([...series].filter(([d])=>d<=origin));
  const scale=mean([...past].flatMap(([d,y])=>past.has(advance(d,-1))?[Math.abs(y-past.get(advance(d,-1))!)]:[]));
  const threshold=endemic(past,target,origin)?.threshold??null;
  models.forEach((model,i)=>{
   const fit=fits[i]!,key=model+':'+horizon,previous=histories.get(key)??[];
   const calibrated=calibrate(previous,origin,fit.predicted,threshold,current);
   const row:Result={scenario,origin,target,horizon,model,actual,predicted:fit.predicted,naive:current,scale,threshold,...calibrated,trainEnd:fit.trainEnd,trainN:fit.trainN};
   // Endemic-channel rule is explicitly the current observed count crossing the
   // past-only target threshold. It has no calibrated continuous probability.
   if(model==='endemic-channel')row.alertProbability=threshold===null?null:Number(current>threshold);
   previous.push(row);histories.set(key,previous);evidence.push(row);
  });count++;
 }
 if(scenario==='Z'||scenario==='M') {
  // No future target is required to construct the saved historical forecast.
  const origin=rows.filter(r=>r.cases!==null&&r.reliable).at(-1)!.week_ending;
  for(const horizon of [1,2,4])for(const model of ['naive','mean-4','ridge-cases','tree-cases'] as const) {
   const fit=fitAt(series,weather,origin,horizon,model);if(!fit)continue;
   const threshold=endemic(new Map([...series].filter(([d])=>d<=origin)),advance(origin,horizon),origin)?.threshold??null;
   latest.push({scenario,model,horizon,origin,target:advance(origin,horizon),...fit,threshold,...calibrate(histories.get(model+':'+horizon)??[],origin,fit.predicted,threshold,series.get(origin)!)});
  }
 }
 console.log(`${scenario}: ${count} common-support origins/horizons, ${models.length} models`);
}
for(const scenario of ['Z','M'] as const)run(manila.scenarios[scenario],scenario,MODELS);
const ncr=JSON.parse(await readFile('data/processed/ncr_weekly.json','utf8')) as {city:string;week_ending:string;cases:number;flags:string[]}[];
for(const scenario of ['Z','M'] as const) {
 const alternative=new Map(ncr.filter(r=>r.city==='MANILA CITY'&&r.week_ending>='2018-01-01'&&r.week_ending<'2021-01-01').map(r=>[r.week_ending,r]));
 const rows=manila.scenarios[scenario].map(r=>{
  if(r.week_ending<'2018-01-01'||r.week_ending>='2021-01-01')return r;
  const alt=alternative.get(r.week_ending);return {...r,cases:alt&&!alt.flags.includes('deaths_exceed_cases')?alt.cases:null};
 });
 run(rows,scenario+'-DOH-sensitivity',['naive','mean-4','ridge-cases']);
}
type Summary={scenario:string;horizon:number;model:Model;fold:string}&ReturnType<typeof metrics>&{skill95:ReturnType<typeof bootstrapSkill>};
const summaries:Summary[]=[];
for(const scenario of [...new Set(evidence.map(r=>r.scenario))])for(const horizon of [1,2,4])for(const model of MODELS)for(const fold of ['development-2017','2018','2019','2020','2021','2022','2023','covid-2020-2021','test-2018-2023']) {
 const rows=evidence.filter(r=>r.scenario===scenario&&r.horizon===horizon&&r.model===model&&(fold==='development-2017'?r.target.startsWith('2017'):fold==='test-2018-2023'?r.target>='2018-01-01':fold==='covid-2020-2021'?r.target.startsWith('2020')||r.target.startsWith('2021'):r.target.startsWith(fold)));
 if(!rows.length)continue;
 summaries.push({scenario,horizon,model,fold,...metrics(rows),skill95:bootstrapSkill(rows)});
}
// Frozen selection uses 2017 development only; no 2018-2023 test outcome selects.
// Weather is research-only because archive reanalysis vintages are not operational.
const selection=['Z','M'].map(scenario=>{
 const candidates=['naive','mean-4','ridge-cases','tree-cases'];
 const scores=candidates.map(model=>({model,mae:mean(summaries.filter(s=>s.scenario===scenario&&s.model===model&&s.fold==='development-2017'&&[1,2].includes(s.horizon)).map(s=>s.mae!))}));
 const valid=scores.filter(s=>s.mae!==null),best=Math.min(...valid.map(s=>s.mae!));
 const selected=valid.find(s=>s.mae!<=best*1.05)?.model??'naive';
 return {scenario,selected,scores,rule:'Simplest within 5% of best mean 1/2-week MAE in 2017 development; weather excluded from operational selection because vintage availability is unverified. 2018-2023 held out.'};
});
const metadata={version:'manila-evaluation-v2',seed:20261025,horizons:[1,2,4],exploratoryHorizon:4,protocol:'Expanding rolling origins. Target-year folds. Fixed hyperparameters; 2017 development only; all methods on paired common support within each scenario/source experiment. COVID flag 2020-2021; no deletion of those years.',intervals:'80% absolute-residual conformal radius with finite-sample rank; at least 20 matured out-of-sample targets by origin. No coverage guarantee under drift.',threshold:'90th percentile of previous-year cases within ±2 ordinal calendar weeks of target; at least 5 observations, past data only. Research threshold, not a DOH outbreak declaration.',mase:'Absolute error scaled by mean one-step naive error on known adjacent calendar weeks in each training prefix.',bootstrap:'Paired moving blocks of 8 observed targets, circular sampling, 400 replicates, 95% percentile interval; gaps mean blocks are not always eight calendar weeks. Exploratory uncertainty, not a powered clinical comparison.',weather:weatherData.availability,weatherSha256:createHash('sha256').update(weatherBytes).digest('hex'),ridge:'Training-only standardization, fixed L2=20, log1p target, no lognormal bias correction, >=32 training examples. Rain uses log1p(mm); temperature Celsius; humidity percent; lags 1-8 before origin; case lags 0-3 and annual harmonics + COVID indicator.',tree:'24 gradient-boosted stumps, learning rate .05, minimum leaf 16, 7 training-only quantile split candidates, L2 leaf=10, log1p target. Fixed, no tuning on test folds.',limitations:['Daily zero/missing ambiguity unresolved','DOH week-ending semantics unconfirmed','Retrospective reanalysis is not real-time vintage data','Sparse alert events can make AUC/precision undefined','Probability of rise and alerts use empirical past residuals, not a separately validated clinical classifier','Mean lead is correct-positive forecast horizon, not episode-based outbreak lead time','Deaths anomalies flagged and excluded in DOH case training under existing policy','No deep learning: fewer than 500 weekly observations per scenario','No current 2026 surveillance; all forecasts historical']};
await mkdir('public/evidence',{recursive:true});
await writeFile('data/processed/evaluation.json',JSON.stringify({metadata,selection,summaries,exclusions,latest,evidence})+'\n');
await writeFile('public/evidence/manila.json',JSON.stringify({metadata,selection,summaries,exclusions,latest,series:manila.scenarios})+'\n');
const lines=['# Manila evaluation','', 'Regenerate with `npm run evaluate`. Fixed seed 20261025. Every value below comes from saved per-origin evidence in data/processed/evaluation.json. No hosted writes.','', '## Protocol','',metadata.protocol,'',metadata.threshold,'',metadata.bootstrap,'','## Main test results (2018–2023, paired support)','', '|Scenario|Horizon|Model|N|MAE|RMSE|MASE|Skill vs naive %|95% skill CI|80% coverage|', '|---|---:|---|---:|---:|---:|---:|---:|---|---:|'];
const fmt=(v:number|null|undefined)=>v==null?'Unavailable':v.toFixed(3);
for(const s of summaries.filter(s=>['Z','M'].includes(s.scenario)&&s.fold==='test-2018-2023'))lines.push(`|${s.scenario}|${s.horizon}|${s.model}|${s.n}|${fmt(s.mae)}|${fmt(s.rmse)}|${fmt(s.mase)}|${fmt(s.skillPercent)}|${fmt(s.skill95?.low)} to ${fmt(s.skill95?.high)}|${fmt(s.coverage80)}|`);
lines.push('','## Selection (2017 development only)','',...selection.map(s=>`- ${s.scenario}: **${s.selected}**. ${s.rule}`),'','## Weather conclusion','');
for(const scenario of ['Z','M'])for(const h of [1,2]) {
 const get=(m:string)=>summaries.find(s=>s.scenario===scenario&&s.horizon===h&&s.model===m&&s.fold==='test-2018-2023');
 const a=get('ridge-cases')!,b=get('ridge-weather')!;
 lines.push(`- ${scenario}, ${h} week(s): ridge-cases MAE ${fmt(a.mae)}; ridge-weather ${fmt(b.mae)}; weather change ${fmt(100*(1-b.mae!/a.mae!))}% versus matched ridge-cases. This is retrospective evidence, not causation or operational availability.`);
}
lines.push('','## Alert and interval evidence','', '|Scenario|Horizon|Model|N alerts|Precision|Recall|F1|ROC-AUC|Brier|False positive rate|Lead (correct-positive horizon)|','|---|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|');
for(const s of summaries.filter(s=>['Z','M'].includes(s.scenario)&&s.fold==='test-2018-2023'&&s.horizon<=2&&['naive','ridge-weather','endemic-channel'].includes(s.model)))lines.push(`|${s.scenario}|${s.horizon}|${s.model}|${s.alertN}|${fmt(s.precision)}|${fmt(s.recall)}|${fmt(s.f1)}|${fmt(s.rocAuc)}|${fmt(s.brier)}|${fmt(s.falseAlarmRate)}|${fmt(s.meanLeadWeeks)}|`);
lines.push('','## Year folds, ablations and source sensitivity','', 'All 2018, 2019, 2020, 2021, 2022, 2023 and pooled COVID folds, all three leave-one-weather-driver-out ridge variants, both tree variants, and 2018–2020 DOH alternate-source sensitivities are saved in evaluation.json. Sparse or missing support is reported, not imputed. Different scenarios are not interchangeable cohorts.','', '## Limitations','',...metadata.limitations.map(s=>'- '+s),'',metadata.ridge,'',metadata.tree,'',metadata.intervals);
await writeFile('docs/EVALUATION.md',lines.join('\n')+'\n');
console.log(JSON.stringify({selection,rows:evidence.length,main:summaries.filter(s=>s.fold==='2023'&&s.horizon===1&&['naive','ridge-cases','ridge-weather'].includes(s.model))},null,2));
