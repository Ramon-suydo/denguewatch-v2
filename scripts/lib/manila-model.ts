export type Series=Map<string,number>;
export type Weather={week_ending:string;rainfall_mm:number;temperature_c:number;humidity_percent:number};
export const advance=(date:string,k:number)=>new Date(Date.parse(date+'T00:00:00Z')+k*7*86400000).toISOString().slice(0,10);
export const mean=(v:number[])=>v.length?v.reduce((a,b)=>a+b,0)/v.length:null;
export function quantile(v:number[],p:number):number|null {if(!v.length)return null;const a=[...v].sort((a,b)=>a-b),i=(a.length-1)*p;return a[Math.floor(i)]+(a[Math.ceil(i)]-a[Math.floor(i)])*(i%1);}
export function endemic(series:Series,target:string,origin:string) {
 const phase=(date:string)=>Math.floor((Date.parse(date)-Date.UTC(Number(date.slice(0,4)),0,1))/604800000);
 const t=phase(target); const ref=[...series].filter(([date])=>date<=origin&&date.slice(0,4)<target.slice(0,4)&&Math.min(Math.abs(phase(date)-t),52-Math.abs(phase(date)-t))<=2).map(([,v])=>v);
 return ref.length<5?null:{median:quantile(ref,.5)!,threshold:quantile(ref,.9)!,n:ref.length};
}
export type Driver='cases'|'weather'|'no-rain'|'no-temperature'|'no-humidity';
export function featureVector(series:Series,weather:Map<string,Weather>,origin:string,h:number,driver:Driver):{names:string[];values:number[]}|null {
 const lags=[0,1,2,3].map(k=>series.get(advance(origin,-k)));
 if(lags.some(v=>v===undefined))return null;
 const target=advance(origin,h),year=Number(target.slice(0,4)),phase=2*Math.PI*Date.parse(target)/604800000/52.1775;
 const names=['log_cases_0','log_cases_1','log_cases_2','log_cases_3','annual_sin','annual_cos','covid_2020_2021'];
 const values=[...lags.map(v=>Math.log1p(v!)),Math.sin(phase),Math.cos(phase),Number(year===2020||year===2021)];
 if(driver!=='cases') {
  for(let lag=1;lag<=8;lag++) {
   const row=weather.get(advance(origin,-lag));if(!row)return null;
   if(driver!=='no-rain'){names.push(`rain_mm_lag_${lag}`);values.push(Math.log1p(row.rainfall_mm));}
   if(driver!=='no-temperature'){names.push(`temperature_c_lag_${lag}`);values.push(row.temperature_c);}
   if(driver!=='no-humidity'){names.push(`humidity_percent_lag_${lag}`);values.push(row.humidity_percent);}
  }
 }
 return {names,values};
}
function solve(matrix:number[][],vector:number[]) {
 const a=matrix.map((r,i)=>[...r,vector[i]]);
 for(let k=0;k<a.length;k++) {
  let pivot=k;for(let i=k+1;i<a.length;i++)if(Math.abs(a[i][k])>Math.abs(a[pivot][k]))pivot=i;
  [a[k],a[pivot]]=[a[pivot],a[k]];
  if(Math.abs(a[k][k])<1e-10)throw Error('Singular ridge matrix');
  const divisor=a[k][k];for(let j=k;j<=a.length;j++)a[k][j]/=divisor;
  for(let i=0;i<a.length;i++)if(i!==k){const f=a[i][k];for(let j=k;j<=a.length;j++)a[i][j]-=f*a[k][j];}
 }
 return a.map(r=>r.at(-1)!);
}
export type Example={date:string;x:number[];y:number};
export function ridge(train:Example[],x:number[]) {
 const p=x.length+1,means=x.map((_,j)=>mean(train.map(r=>r.x[j]))!),scales=means.map((m,j)=>Math.sqrt(mean(train.map(r=>(r.x[j]-m)**2))!)||1);
 const z=(x:number[])=>[1,...x.map((v,j)=>(v-means[j])/scales[j])];
 const a=Array.from({length:p},()=>Array(p).fill(0) as number[]),b=Array(p).fill(0) as number[];
 for(const row of train){const v=z(row.x);for(let j=0;j<p;j++){b[j]+=v[j]*row.y;for(let k=0;k<p;k++)a[j][k]+=v[j]*v[k];}}
 for(let j=1;j<p;j++)a[j][j]+=20;
 const coefficients=solve(a,b),v=z(x),predicted=Math.max(0,Math.expm1(coefficients.reduce((s,c,j)=>s+c*v[j],0)));
 return {predicted,coefficients:coefficients.slice(1),scales,intercept:coefficients[0]};
}
// Fixed deterministic gradient-boosted regression stumps, log target, 24 rounds,
// learning rate .05, min leaf 16, seven quantile split candidates, L2 leaf penalty 10.
export function boostedStumps(train:Example[],x:number[]) {
 const initial=mean(train.map(r=>r.y))!,fitted=train.map(()=>initial),importance=x.map(()=>0);let output=initial;
 const thresholds=x.map((_,j)=>Array.from({length:7},(_,q)=>quantile(train.map(r=>r.x[j]),(q+1)/8)!));
 for(let round=0;round<24;round++) {
  const residual=train.map((r,i)=>r.y-fitted[i]);let best:{j:number;t:number;l:number;r:number;gain:number}|null=null;
  for(let j=0;j<x.length;j++) for(let q=1;q<=7;q++) {
   const t=thresholds[j][q-1];let nl=0,nr=0,sl=0,sr=0;
   for(let i=0;i<train.length;i++)if(train[i].x[j]<=t){nl++;sl+=residual[i];}else{nr++;sr+=residual[i];}
   if(nl<16||nr<16)continue;
   const l=sl/(nl+10),r=sr/(nr+10),gain=sl*sl/(nl+10)+sr*sr/(nr+10);
   if(!best||gain>best.gain)best={j,t,l,r,gain};
  }
  if(!best)break;
  const split=best;importance[split.j]+=split.gain;
  for(let i=0;i<train.length;i++)fitted[i]+=.05*(train[i].x[split.j]<=split.t?split.l:split.r);
  output+=.05*(x[split.j]<=split.t?split.l:split.r);
 }
 return {predicted:Math.max(0,Math.expm1(output)),importance};
}
export const MODELS=['naive','mean-4','seasonal-naive','endemic-channel','ridge-cases','ridge-weather','ridge-no-rain','ridge-no-temperature','ridge-no-humidity','tree-cases','tree-weather'] as const;
export type Model=typeof MODELS[number];
export type Result={scenario:string;origin:string;target:string;horizon:number;model:Model;actual:number;predicted:number;naive:number;scale:number|null;threshold:number|null;alertProbability:number|null;riseProbability:number|null;low80:number|null;high80:number|null;trainEnd:string|null;trainN:number};
export function fitAt(series:Series,weather:Map<string,Weather>,origin:string,h:number,model:Model) {
 // Truncate inside the public fitter as well as in the rolling-origin caller.
 const past=new Map([...series].filter(([d])=>d<=origin)),target=advance(origin,h);
 const channel=endemic(past,target,origin);
 const simple=model==='naive'?past.get(origin):model==='mean-4'?mean([0,1,2,3].map(k=>past.get(advance(origin,-k))).filter((v):v is number=>v!==undefined)):model==='seasonal-naive'?past.get(advance(target,-52)):model==='endemic-channel'?channel?.median:undefined;
 if(!model.startsWith('ridge')&&!model.startsWith('tree')) {
  if(model==='mean-4'&&[0,1,2,3].some(k=>!past.has(advance(origin,-k))))return null;
  return simple===undefined||simple===null?null:{predicted:simple,trainN:past.size,trainEnd:origin,names:[] as string[],coefficients:[] as number[]};
 }
 const driver:Driver=model.endsWith('cases')?'cases':model.endsWith('no-rain')?'no-rain':model.endsWith('no-temperature')?'no-temperature':model.endsWith('no-humidity')?'no-humidity':'weather';
 const x=featureVector(past,weather,origin,h,driver);if(!x)return null;
 const train=[...past].sort(([a],[b])=>a.localeCompare(b)).flatMap(([date,y])=>{
  const f=featureVector(past,weather,advance(date,-h),h,driver);return f?[{date,x:f.values,y:Math.log1p(y)}]:[];
 });
 if(train.length<32)return null;
 const fit=model.startsWith('ridge')?ridge(train,x.values):boostedStumps(train,x.values);
 return {predicted:fit.predicted,trainN:train.length,trainEnd:train.at(-1)!.date,names:x.names,coefficients:'coefficients' in fit?fit.coefficients:fit.importance};
}
export function calibrate(previous:Result[],origin:string,predicted:number,threshold:number|null,current:number) {
 const residuals=previous.filter(p=>p.target<=origin).map(p=>p.actual-p.predicted);
 if(residuals.length<20)return {low80:null,high80:null,alertProbability:null,riseProbability:null};
 // Finite-sample conservative absolute-residual conformal radius. Previous predictions
 // were made out of sample; only targets matured by this origin enter calibration.
 const sorted=residuals.map(Math.abs).sort((a,b)=>a-b),radius=sorted[Math.min(sorted.length-1,Math.ceil((sorted.length+1)*.8)-1)];
 const probability=(cut:number)=>(1+residuals.filter(e=>predicted+e>cut).length)/(residuals.length+2);
 return {low80:Math.max(0,predicted-radius),high80:predicted+radius,alertProbability:threshold===null?null:probability(threshold),riseProbability:probability(current)};
}
export function auc(pairs:{actual:boolean;p:number}[]) {
 const positive=pairs.filter(r=>r.actual),negative=pairs.filter(r=>!r.actual);if(!positive.length||!negative.length)return null;
 let wins=0;for(const p of positive)for(const n of negative)wins+=p.p>n.p?1:p.p===n.p?.5:0;
 return wins/(positive.length*negative.length);
}
export function metrics(rows:Result[]) {
 const errors=rows.map(r=>Math.abs(r.actual-r.predicted)),baseline=mean(rows.map(r=>Math.abs(r.actual-r.naive)));
 const intervals=rows.filter(r=>r.low80!==null),alert=rows.filter(r=>r.threshold!==null&&r.alertProbability!==null);
 const pairs=alert.map(r=>({actual:r.actual>r.threshold!,p:r.alertProbability!}));
 const tp=pairs.filter(r=>r.actual&&r.p>=.5).length,fp=pairs.filter(r=>!r.actual&&r.p>=.5).length,fn=pairs.filter(r=>r.actual&&r.p<.5).length,tn=pairs.filter(r=>!r.actual&&r.p<.5).length;
 const precision=tp+fp?tp/(tp+fp):null,recall=tp+fn?tp/(tp+fn):null;
 return {n:rows.length,mae:mean(errors),rmse:rows.length?Math.sqrt(mean(rows.map(r=>(r.actual-r.predicted)**2))!):null,mase:mean(rows.filter(r=>r.scale!==null&&r.scale>0).map(r=>Math.abs(r.actual-r.predicted)/r.scale!)),skillPercent:baseline?100*(1-mean(errors)!/baseline):null,
 intervalN:intervals.length,coverage80:intervals.length?intervals.filter(r=>r.actual>=r.low80!&&r.actual<=r.high80!).length/intervals.length:null,
 alertN:alert.length,tp,fp,fn,tn,precision,recall,f1:2*tp+fp+fn?2*tp/(2*tp+fp+fn):null,rocAuc:auc(pairs),brier:mean(pairs.map(r=>(r.p-Number(r.actual))**2)),falseAlarmRate:fp+tn?fp/(fp+tn):null,
 meanLeadWeeks:tp?mean(alert.filter(r=>r.actual>r.threshold!&&r.alertProbability!>=.5).map(r=>r.horizon)):null};
}
export function bootstrapSkill(rows:Result[],seed=20261025) {
 if(rows.length<8)return null;
 let state=seed>>>0;const random=()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return state/4294967296;};
 const skills:number[]=[];for(let b=0;b<400;b++) {
  const sample:Result[]=[];while(sample.length<rows.length){const start=Math.floor(random()*rows.length);for(let j=0;j<Math.min(8,rows.length)&&sample.length<rows.length;j++)sample.push(rows[(start+j)%rows.length]);}
  const baseline=mean(sample.map(r=>Math.abs(r.actual-r.naive)));const error=mean(sample.map(r=>Math.abs(r.actual-r.predicted)));if(baseline&&error!==null)skills.push(100*(1-error/baseline));
 }
 return {low:quantile(skills,.025),high:quantile(skills,.975),blockSize:8,replicates:400,seed};
}
