import {useEffect,useState} from 'react';
import {validateLiveRows,freshLive,type LiveData} from './model';
import {manilaToday} from '../ml/live';
export function useLiveManila(){
 const [data,setData]=useState<LiveData|null>(null),[error,setError]=useState(false),[clock,setClock]=useState(Date.now()),[attempt,setAttempt]=useState(0);
 useEffect(()=>{let cancelled=false,inFlight=false;const controller=new AbortController();
 async function read(){if(inFlight)return;inFlight=true;try{
  const signal=AbortSignal.any([controller.signal,AbortSignal.timeout(8000)]);
  const response=await fetch('/live-manila/weekly.json',{signal,cache:'no-cache'});if(!response.ok)throw Error('Live data unavailable');
  const saved=await response.json() as LiveData;
  validateLiveRows(saved.rows,saved.rows.filter(r=>r.source_url===null).map(r=>r.week_end));
  if(!cancelled)setData(current=>current??saved);
  let next=saved;
  // Optional reviewed admin versions. A missing local/hosted migration leaves the shipped version intact.
  try{if(!navigator.onLine)throw Error('Offline');const {getSupabase}=await import('../lib/supabase');const {data:published,error}=await getSupabase().rpc('published_manila_live_input').abortSignal(signal);
   if(!error&&published?.data){
    validateLiveRows(published.data.rows,saved.rows.filter(r=>r.source_url===null).map(r=>r.week_end));
    next=published.data as LiveData;}
  }catch{/* Aggregate-only shipped data stays available. No publication is claimed. */}
  if(!cancelled){setData(next);setError(false);setClock(Date.now());}
 }catch{if(!cancelled)setError(true);}finally{inFlight=false;}}
 void read();const timer=setInterval(()=>{setClock(Date.now());void read();},60000);return()=>{cancelled=true;controller.abort();clearInterval(timer);};},[attempt]);
 return {data,error,fresh:Boolean(data&&freshLive(data.metadata.last_week_end,manilaToday(new Date(clock)))),retry:()=>setAttempt(n=>n+1)};
}
