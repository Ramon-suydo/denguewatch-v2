import {useEffect,useState} from 'react';
import type {ForecastData,CityPrediction} from './types';
import {validateNcrRows,liveIsFresh,manilaToday,type WeeklyRow} from './live';
import type {ModelBundle} from './scorer';
export function useForecast(full=false){
 const [data,setData]=useState<ForecastData|null>(null),[error,setError]=useState(false),[retry,setRetry]=useState(0),[requestedMode,setMode]=useState<'Replay'|'Live'>('Replay'),[live,setLive]=useState<CityPrediction[]|null>(null),[checking,setChecking]=useState(true),[clock,setClock]=useState(Date.now());
 useEffect(()=>{const controller=new AbortController();let cancelled=false;let liveAssets:Promise<[ModelBundle,WeeklyRow[]]>|null=null;
 async function read<T>(path:string):Promise<T>{const response=await fetch(path,{signal:controller.signal});if(!response.ok)throw Error('Data unavailable');return response.json() as Promise<T>;}
 async function start(){try{const saved=await read<ForecastData>(full?'/ml/replay.json':'/ml/summary.json');if(cancelled)return;setData(saved);setError(false);
 async function refresh(){setChecking(true);try{if(!navigator.onLine)throw Error('Offline');const {getSupabase}=await import('../lib/supabase');const request=new AbortController();const abort=()=>request.abort();controller.signal.addEventListener('abort',abort,{once:true});const timeout=setTimeout(abort,5000);let uploaded;try{const response=await getSupabase().rpc('published_ncr_model_input').abortSignal(request.signal);if(response.error)throw Error('Hosted input unavailable');uploaded=response.data;}finally{clearTimeout(timeout);controller.signal.removeEventListener('abort',abort);}
 if(!uploaded?.rows)throw Error('No published input');const rows=validateNcrRows(uploaded.rows);if(!liveIsFresh(rows.at(-1)!.week_ending))throw Error('Stale input');
 liveAssets??=Promise.all([read<ModelBundle>('/ml/models.json'),read<WeeklyRow[]>('/ml/history.json')]);const [model,history]=await liveAssets;if(model.version!==saved.version)throw Error('Model version differs');const {liveForecast}=await import('./live-scorer');const result=liveForecast(model,history,rows);if(!cancelled)setLive(result);
 }catch{if(!cancelled)setLive(null);}finally{if(!cancelled){setChecking(false);setClock(Date.now());}}}
 await refresh();if(!cancelled)timer=setInterval(()=>void refresh(),60000);
 }catch{if(!cancelled){setError(true);setChecking(false);}}}
 let timer:ReturnType<typeof setInterval>|undefined;void start();return()=>{cancelled=true;controller.abort();clearInterval(timer);};},[full,retry]);
 const fresh=Boolean(live?.length&&liveIsFresh(live[0].origin,manilaToday(new Date(clock))));
 return {data,error,checking,live:fresh?live:null,mode:requestedMode==='Live'&&fresh?'Live' as const:'Replay' as const,setMode,retry:()=>setRetry(n=>n+1)};
}
