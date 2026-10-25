import { config } from 'dotenv';
config({path:['.env.local','.env'],quiet:true});
try{
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url || !key) throw Error();
 const endpoint=new URL('/rest/v1/rpc/purge_community_retention',url);if(endpoint.protocol!=='https:' || endpoint.username || endpoint.password)throw Error();
 const response=await fetch(endpoint,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw Error();await response.body?.cancel();console.log('Protected retention RPC completed. No report details logged.');
}catch{console.error('Retention RPC failed or server configuration is missing. No private details logged.');process.exitCode=1;}
