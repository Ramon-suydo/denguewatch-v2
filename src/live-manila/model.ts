// Independent aggregate-only path. Never imported by historical preparation or ML training.
export const DAY = 86400000;
export const shift = (date: string, days: number) => new Date(Date.parse(date + 'T00:00:00Z') + days * DAY).toISOString().slice(0, 10);
export type LiveRow = {week_start:string;week_end:string;report_monday:string;total_since_jan1:number;weekly_new_cases:number;total_is_estimate:boolean;weekly_is_estimate:boolean;note:string;source_url:string|null;evidence_file?:string|null;observed:boolean;raw_note?:string};
export type HistoricalWeek = {week_ending:string;cases:number|null;reliable:boolean;calendar_days_in_coverage:number};
export function isoDate(value: unknown): value is string {
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const n=Date.parse(value+'T00:00:00Z');return Number.isFinite(n)&&new Date(n).toISOString().slice(0,10)===value;
}
export function validateLiveRows(input: unknown, legacyEnds: readonly string[] = []): LiveRow[] {
 if(!Array.isArray(input)||!input.length||input.length>1000)throw Error('Supply 1 to 1000 weekly rows.');
 const rows:LiveRow[]=input.map((item:unknown)=>{
  if(!item||typeof item!=='object')throw Error('Invalid weekly row.');
  const r=item as LiveRow;
  const allowed=['week_start','week_end','report_monday','total_since_jan1','weekly_new_cases','total_is_estimate','weekly_is_estimate','note','source_url','evidence_file','observed','raw_note'];
  if(Object.keys(r).some(k=>!allowed.includes(k)))throw Error('Unknown weekly field.');
  if(!isoDate(r.week_start)||!isoDate(r.week_end)||!isoDate(r.report_monday)||new Date(r.week_start+'T00:00:00Z').getUTCDay()!==1||r.week_end!==shift(r.week_start,6)||r.report_monday!==shift(r.week_end,1))throw Error('Use Monday–Sunday weeks and the following report Monday.');
  if(![r.total_since_jan1,r.weekly_new_cases].every(n=>Number.isSafeInteger(n)&&n>=0&&n<=10000000))throw Error('Counts must be non-negative whole numbers.');
  if(typeof r.total_is_estimate!=='boolean'||typeof r.weekly_is_estimate!=='boolean')throw Error('Both estimate flags are required.');
  if(typeof r.note!=='string'||r.note.length>2000||((r.total_is_estimate||r.weekly_is_estimate)&&!r.note.trim()))throw Error('Every estimated row needs a note.');
  if(r.total_is_estimate&&!r.weekly_is_estimate)throw Error('An estimated total makes the weekly difference estimated.');
  if(r.source_url===null){if(!legacyEnds.includes(r.week_end))throw Error('A public source post URL is required for new rows.');}
  else {let url:URL;try{url=new URL(r.source_url);}catch{throw Error('A public HTTPS source URL is required.');}if(url.protocol!=='https:'||url.username||url.password||!/(^|\.)facebook\.com$/.test(url.hostname)||!url.pathname.replaceAll('/',''))throw Error('Use the public Facebook post HTTPS URL.');}
  if(r.evidence_file!=null&&(!/^docs\/evidence\/live-manila\/[a-zA-Z0-9_./-]+\.(png|jpg|jpeg|webp|pdf)$/.test(r.evidence_file)||r.evidence_file.includes('..')))throw Error('Evidence must stay under docs/evidence/live-manila/.');
  return {...r,observed:!r.weekly_is_estimate};
 });
 for(let i=1;i<rows.length;i++){
  const r=rows[i],p=rows[i-1];
  if(r.week_start!==shift(p.week_start,7))throw Error('Duplicate, unsorted or missing week.');
  if(r.week_start.slice(0,4)!==p.week_start.slice(0,4))throw Error('Start a separately reviewed series at the new year; cumulative totals reset.');
  if(r.total_since_jan1<p.total_since_jan1||r.weekly_new_cases!==r.total_since_jan1-p.total_since_jan1)throw Error('Weekly cases must equal the non-negative cumulative difference.');
  if(p.total_is_estimate&&!r.weekly_is_estimate)throw Error('A difference from an estimated prior total is estimated.');
 }
 return rows;
}
// R type-7 / NumPy default linear quantile, fixed explicitly for reproducibility.
export function quantile(values:number[],q:number):number {
 if(!values.length||q<0||q>1)throw Error('Quantile needs data and q in [0,1].');
 const sorted=[...values].sort((a,b)=>a-b),p=(sorted.length-1)*q,i=Math.floor(p);return sorted[i]+(sorted[Math.ceil(p)]-sorted[i])*(p-i);
}
export function completeWeeks(rows:HistoricalWeek[]){return rows.filter(r=>r.reliable&&r.cases!==null&&r.calendar_days_in_coverage===7&&r.week_ending<'2024-01-01');}
export function ratioPairs(rows:HistoricalWeek[],horizon:number,threshold:number){
 const complete=completeWeeks(rows),byDate=new Map(complete.map(r=>[r.week_ending,r]));
 return complete.flatMap(r=>{const future=byDate.get(shift(r.week_ending,7*horizon));return r.cases!>=threshold&&future?.cases!=null?[{origin:r.week_ending,target:future.week_ending,base:r.cases!,actual:future.cases,ratio:future.cases/r.cases!}]:[];});
}
export function intervalStats(rows:HistoricalWeek[],horizon:number,threshold:number){
 const pairs=ratioPairs(rows,horizon,threshold),ratios=pairs.map(p=>p.ratio);
 if(ratios.length<2)throw Error('Insufficient historical ratio pairs.');
 const folds=[...new Set(pairs.map(p=>p.origin.slice(0,4)))].map(year=>{
  const train=pairs.filter(p=>p.origin.slice(0,4)!==year&&p.target.slice(0,4)!==year),test=pairs.filter(p=>p.origin.slice(0,4)===year);
  if(train.length<2)return {year,train_n:train.length,n:0,covered:0,coverage:null,persistence_mae:null};
  const lo=quantile(train.map(p=>p.ratio),.1),hi=quantile(train.map(p=>p.ratio),.9),covered=test.filter(p=>p.ratio>=lo&&p.ratio<=hi).length;
  return {year,train_n:train.length,n:test.length,covered,coverage:test.length?covered/test.length:null,persistence_mae:test.length?test.reduce((s,p)=>s+Math.abs(p.actual-p.base),0)/test.length:null};
 });
 const n=folds.reduce((s,f)=>s+f.n,0),covered=folds.reduce((s,f)=>s+f.covered,0);
 return {horizon,threshold,n:pairs.length,quantiles:[.1,.5,.9].map(q=>quantile(ratios,q)),loyo:{n,covered,coverage:n?covered/n:null,folds}};
}
export function freshLive(last:string,today:string){if(!isoDate(last)||!isoDate(today))return false;const age=(Date.parse(today)-Date.parse(last))/DAY;return age>=0&&age<=14;}
export function buildLive(rows:LiveRow[],history:HistoricalWeek[]){
 const complete=completeWeeks(history),values=complete.map(r=>r.cases!),latest=rows.at(-1)!;
 const sensitivity=[80,100,150].flatMap(threshold=>[1,2].map(h=>intervalStats(history,h,threshold)));
 const observed=rows.filter(r=>r.observed).slice(-3),tolerance=quantile(ratioPairs(history,1,100).map(p=>Math.abs(p.ratio-1)),.5);
 const weeklyChange=observed.length===3&&observed[0].weekly_new_cases>0?Math.pow(observed[2].weekly_new_cases/observed[0].weekly_new_cases,7/((Date.parse(observed[2].week_end)-Date.parse(observed[0].week_end))/DAY))-1:null;
 return {version:'manila-live-v1',metadata:{source:'Manila Information Office Facebook posts, manually transcribed; unofficial',verified:false,date_range:[rows[0].week_start,latest.week_end],last_week_end:latest.week_end,row_count:rows.length,total_estimate_count:rows.filter(r=>r.total_is_estimate).length,weekly_estimate_count:rows.filter(r=>r.weekly_is_estimate).length,observed_weekly_count:rows.filter(r=>r.observed).length,missing_source_count:rows.filter(r=>r.source_url===null).length,first_week_prior_total_available:false,translation_review:'NEEDS OWNER'},rows,
 method:{historical_scenario:'M',complete_weeks:values.length,historical_max:Math.max(...values),high_count_origins:values.filter(v=>v>=100).length,sensitivity,direction_tolerance:tolerance,direction_observed_weeks:observed.map(r=>r.week_end),direction_weekly_change:weeklyChange,direction:weeklyChange===null?'Unavailable':weeklyChange>tolerance?'Rising':weeklyChange< -tolerance?'Falling':'Steady',percentile:100*values.filter(v=>v<latest.weekly_new_cases).length/values.length,exceeds_historical_max:latest.weekly_new_cases>Math.max(...values),recent_peak:Math.max(...rows.map(r=>r.weekly_new_cases)),context_extrapolation:true,
 ranges:[1,2].map(horizon=>{const s=sensitivity.find(s=>s.threshold===100&&s.horizon===horizon)!;return {horizon,target_week_start:shift(latest.week_start,horizon*7),target_week_end:shift(latest.week_end,horizon*7),n:s.n,low:Math.floor(latest.weekly_new_cases*s.quantiles[0]),median:Math.round(latest.weekly_new_cases*s.quantiles[1]),high:Math.ceil(latest.weekly_new_cases*s.quantiles[2]),persistence:latest.weekly_new_cases};})}};
}
export type LiveData=ReturnType<typeof buildLive>;
export function appendWeek(rows:LiveRow[],input:{total:number;report:string;url:string;estimated:boolean;note:string;evidence?:string}):LiveRow[]{
 const previous=rows.at(-1);if(!previous)throw Error('A prior reviewed series is required.');
 const previousObserved=[...rows].reverse().find(r=>!r.total_is_estimate);if(!previousObserved)throw Error('No observed cumulative anchor.');
 // A weekly difference touching an estimated total remains estimated; validation requires a note.
 const next:LiveRow={week_start:shift(previous.week_start,7),week_end:shift(previous.week_end,7),report_monday:input.report,total_since_jan1:input.total,weekly_new_cases:input.total-previous.total_since_jan1,total_is_estimate:input.estimated,weekly_is_estimate:input.estimated||previous.total_is_estimate,note:input.note,source_url:input.url,evidence_file:input.evidence||null,observed:!input.estimated&&!previous.total_is_estimate};
 // Never call the whole multiweek difference a one-week observation.
 return validateLiveRows([...rows,next],rows.filter(r=>r.source_url===null).map(r=>r.week_end));
}
