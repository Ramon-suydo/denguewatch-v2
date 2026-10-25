import cities from '../content/ncr-cities.json';
import {score,type ModelBundle} from './scorer';
export type WeeklyRow={city:string;week_ending:string;cases:number};
const DAY=86400000;
export function manilaToday(now=new Date()){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Manila',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);return ['year','month','day'].map(k=>parts.find(p=>p.type===k)!.value).join('-');}
export function validateNcrRows(input:unknown,today=manilaToday(),minimumWeeks=26):WeeklyRow[]{
 if(!Array.isArray(input)||input.length<minimumWeeks*17||input.length>5000)throw Error(`Supply ${minimumWeeks} to 294 complete weeks for all 17 cities.`);
 const seen=new Set<string>(),weeks=new Map<string,Set<string>>();
 const rows=input.map((value:unknown)=>{if(!value||typeof value!=='object')throw Error('Invalid CSV row.');const r=value as WeeklyRow;
 if(Object.keys(r).sort().join(',')!=='cases,city,week_ending'||!cities.includes(r.city)||!Number.isInteger(r.cases)||r.cases<0||r.cases>100000)throw Error('Use known city names and whole counts from 0 to 100,000.');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(r.week_ending))throw Error('Use Sunday dates in YYYY-MM-DD format.');
 const date=new Date(r.week_ending+'T00:00:00Z');if(!Number.isFinite(+date)||date.toISOString().slice(0,10)!==r.week_ending||date.getUTCDay()!==0||r.week_ending>today||r.week_ending<'2016-01-10')throw Error('Use valid past Sunday dates.');
 const key=r.city+'|'+r.week_ending;if(seen.has(key))throw Error('Duplicate city/week.');seen.add(key);if(!weeks.has(r.week_ending))weeks.set(r.week_ending,new Set());weeks.get(r.week_ending)!.add(r.city);return {city:r.city,week_ending:r.week_ending,cases:r.cases};});
 const dates=[...weeks.keys()].sort();for(let i=0;i<dates.length;i++){if(weeks.get(dates[i])!.size!==17)throw Error('Every week needs all 17 cities.');if(i&&(+new Date(dates[i])-+new Date(dates[i-1]))!==7*DAY)throw Error('Weekly gaps are not allowed in an uploaded batch.');}
 return rows.sort((a,b)=>a.week_ending.localeCompare(b.week_ending)||a.city.localeCompare(b.city));
}
export function liveIsFresh(latest:string,today=manilaToday()){const age=(+new Date(today+'T00:00:00Z')-+new Date(latest+'T00:00:00Z'))/DAY;return Number.isFinite(age)&&age>=0&&age<=21;}
function weekNumber(day:string){const d=new Date(day+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+4-(d.getUTCDay()||7));return Math.ceil((((+d-Date.UTC(d.getUTCFullYear(),0,1))/DAY)+1)/7);}
export function cityFeatures(rows:WeeklyRow[],city:string,origin:string){
 const byDate=new Map<string,Map<string,number>>();for(const r of rows){if(r.week_ending>origin)continue;if(!byDate.has(r.week_ending))byDate.set(r.week_ending,new Map());byDate.get(r.week_ending)!.set(r.city,r.cases);}
 const own=rows.filter(r=>r.city===city&&r.week_ending<=origin).sort((a,b)=>a.week_ending.localeCompare(b.week_ending));if(own.length<26)throw Error('At least 26 observed weeks are required.');
 const dates=Array.from({length:8},(_,i)=>new Date(+new Date(origin+'T00:00:00Z')-7*i*DAY).toISOString().slice(0,10));for(const day of dates)if(!byDate.get(day)||cities.some(c=>!byDate.get(day)!.has(c)))throw Error('Eight complete calendar weeks are required.');
 const counts=dates.map(d=>byDate.get(d)!.get(city)!);const mean=(v:number[])=>v.reduce((a,b)=>a+b,0)/v.length;const mu=mean(own.map(r=>r.cases)),sd=Math.sqrt(own.reduce((sum,r)=>sum+(r.cases-mu)**2,0)/(own.length-1)),threshold=Math.max(mu+sd,10),m4=mean(counts.slice(0,4));
 const rest=dates.map(d=>cities.filter(c=>c!==city).reduce((sum,c)=>sum+byDate.get(d)!.get(c)!,0));const target=new Date(+new Date(origin+'T00:00:00Z')+7*DAY).toISOString().slice(0,10),tw=weekNumber(target);
 const seasonal=own.filter(r=>r.week_ending.slice(0,4)<target.slice(0,4)&&Math.min(Math.abs(weekNumber(r.week_ending)-tw),53-Math.abs(weekNumber(r.week_ending)-tw))<=2);const expectation=seasonal.length>=5?mean(seasonal.map(r=>r.cases)):mu;
 return {features:[...counts.slice(0,4),m4,mean(counts),counts[0]/Math.max(m4,1),counts[0]/threshold,weekNumber(origin),rest[0],mean(rest.slice(0,4)),...cities.map(c=>Number(c===city))],threshold,seasonalRaw:expectation/(expectation+threshold),history:counts.slice().reverse(),target,cases:counts[0]};
}
export function liveForecast(bundle:ModelBundle,history:WeeklyRow[],upload:unknown,today=manilaToday()){
 const incoming=validateNcrRows(upload,today),latest=incoming.at(-1)!.week_ending;if(!liveIsFresh(latest,today))throw Error('Data is older than 21 days. Upload recent weekly counts.');
 const map=new Map(history.map(r=>[r.city+'|'+r.week_ending,r]));for(const r of incoming)map.set(r.city+'|'+r.week_ending,r);const combined=[...map.values()];
 return cities.map((city,city_id)=>{const input=cityFeatures(combined,city,latest),prediction=score(bundle,input.features,bundle.chosen,input.seasonalRaw);return {city,city_id,origin:latest,target:input.target,cases:input.cases,actual_cases:null,threshold:input.threshold,currently_above:input.cases>input.threshold,label:null,history:input.history,probability:prediction.probability,predicted_class:prediction.class};});
}
