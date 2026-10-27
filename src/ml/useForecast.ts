import {useEffect,useMemo,useState} from 'react';
import type {ForecastData,CityPrediction} from './types';
import cities from '../content/ncr-cities.json';
import {useLiveManila} from '../live-manila/useLiveManila';
import {shift} from '../live-manila/model';
export function useForecast(full=false){
 const [data,setData]=useState<ForecastData|null>(null),[error,setError]=useState(false),[retry,setRetry]=useState(0),[requestedMode,setMode]=useState<'Replay'|'Live'>('Replay');
 const manila=useLiveManila();
 useEffect(()=>{const controller=new AbortController();void fetch(full?'/ml/replay.json':'/ml/summary.json',{signal:controller.signal}).then(r=>{if(!r.ok)throw Error('Data unavailable');return r.json();}).then(saved=>{setData(saved);setError(false);}).catch(()=>{if(!controller.signal.aborted)setError(true);});return()=>controller.abort();},[full,retry]);
 // Map geometry adapter only: null probabilities for every city. No 2026 ML scoring.
 const live=useMemo<CityPrediction[]|null>(()=>{if(!manila.data||!manila.fresh)return null;const source=manila.data,latest=source.rows.at(-1)!;return cities.map((city,i)=>({city,city_id:i,origin:latest.week_end,target:shift(latest.week_end,7),cases:city==='MANILA CITY'?latest.weekly_new_cases:null,actual_cases:null,threshold:0,currently_above:null,label:null,history:city==='MANILA CITY'?source.rows.slice(-8).map(r=>r.weekly_new_cases):Array(8).fill(null),probability:null,predicted_class:null,reason:city==='MANILA CITY'?'provisional_manila':'no_recent_data'}));},[manila.data,manila.fresh]);
 return {data,error,liveError:manila.error,checking:!manila.data&&!manila.error,live,liveManila:manila.data,stale:Boolean(manila.data&&!manila.fresh),mode:requestedMode==='Live'&&live?'Live' as const:'Replay' as const,setMode,retry:()=>{setRetry(n=>n+1);manila.retry();}};
}
