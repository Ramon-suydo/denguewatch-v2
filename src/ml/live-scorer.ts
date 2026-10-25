import cities from '../content/ncr-cities.json';
import {score,type ModelBundle} from './scorer';
import {cityFeatures,validateNcrRows,liveIsFresh,manilaToday,type WeeklyRow} from './live';
export function liveForecast(bundle:ModelBundle,history:WeeklyRow[],upload:unknown,today=manilaToday()){
 const incoming=validateNcrRows(upload,today),latest=incoming.at(-1)!.week_ending;if(!liveIsFresh(latest,today))throw Error('Data is older than 21 days. Upload recent weekly counts.');
 const map=new Map(history.map(r=>[r.city+'|'+r.week_ending,r]));for(const r of incoming)map.set(r.city+'|'+r.week_ending,r);const combined=[...map.values()];
 return cities.map((city,city_id)=>{const input=cityFeatures(combined,city,latest),prediction=score(bundle,input.features,bundle.chosen,input.seasonalRaw);return {city,city_id,origin:latest,target:input.target,cases:input.cases,actual_cases:null,threshold:input.threshold,currently_above:input.cases>input.threshold,label:null,history:input.history,probability:prediction.probability,predicted_class:prediction.class};});
}
