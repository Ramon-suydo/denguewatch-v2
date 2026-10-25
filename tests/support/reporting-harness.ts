// LOCAL TEST DATA ONLY. Not imported by the app; no hosted endpoints/credentials.
// The adapter models Auth/PostgREST HTTP, verifies signed test JWTs, and executes
// the actual migrations/RPCs under PostgreSQL roles. It is not Supabase Auth certification.
import { PGlite } from '@electric-sql/pglite';
import { readFile,readdir } from 'node:fs/promises';
import { createHmac,randomBytes,timingSafeEqual } from 'node:crypto';
import type { Page } from '@playwright/test';
export async function reportingHarness(staffRole:'moderator'|'admin'='moderator'){
 const db=new PGlite(),userId='00000000-0000-4000-8000-000000000099';
 const password=randomBytes(24).toString('base64url'),secret=randomBytes(32),email=staffRole+'@local.invalid';
 const claims={sub:userId,role:'authenticated',aud:'authenticated',aal:'aal2',iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+3600,amr:[{method:'totp',timestamp:Math.floor(Date.now()/1000)}]};
 const head=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url'),body=Buffer.from(JSON.stringify(claims)).toString('base64url');
 const token=`${head}.${body}.${createHmac('sha256',secret).update(head+'.'+body).digest('base64url')}`;
 const user={id:userId,aud:'authenticated',role:'authenticated',email,app_metadata:{provider:'email',providers:['email']},user_metadata:{dataset:'LOCAL TEST DATA ONLY'},created_at:new Date().toISOString(),factors:[]};
 await db.exec("create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema public,auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;alter default privileges in schema public grant all on tables to anon,authenticated,service_role;alter default privileges in schema public grant all on sequences to anon,authenticated,service_role;");
 for(const f of (await readdir('supabase/migrations')).filter(x=>x.endsWith('.sql')).sort())await db.exec(await readFile('supabase/migrations/'+f,'utf8'));
 await db.query('insert into auth.users(id) values($1)',[userId]);await db.query("insert into private.staff_roles values($1,$2)",[userId,staffRole]);await db.exec('update public.reporting_v2_policy set enabled=true');
 let serial=Promise.resolve();
 function valid(bearer:string){
  if(bearer!==token)return false;const parts=bearer.split('.'),signed=createHmac('sha256',secret).update(parts[0]+'.'+parts[1]).digest();const received=Buffer.from(parts[2],'base64url');return signed.length===received.length&&timingSafeEqual(signed,received);
 }
 async function attach(page:Page){
  await page.route('https://denguewatch-tests.invalid/**',async route=>{
   const request=route.request(),url=new URL(request.url()),path=url.pathname;
   const data=request.postDataJSON()??{},bearer=request.headers().authorization?.replace(/^Bearer /,'')??'';
   if(path==='/auth/v1/token'){
    if(data.email!==email||data.password!==password)return route.fulfill({status:400,json:{error:'invalid_grant',error_description:'Invalid local test credentials'}});
    return route.fulfill({status:200,json:{access_token:token,token_type:'bearer',expires_in:3600,expires_at:claims.exp,refresh_token:randomBytes(24).toString('base64url'),user}});
   }
   if(path==='/auth/v1/logout')return route.fulfill({status:204,body:''});
   if(path==='/auth/v1/user')return route.fulfill({status:valid(bearer)?200:401,json:valid(bearer)?user:{error:'Unauthorized'}});
   if(!path.startsWith('/rest/v1/'))return route.fulfill({status:404,json:{error:'Not implemented by local test adapter'}});
   const previous=serial;let unlock!:()=>void;serial=new Promise<void>(resolve=>{unlock=resolve;});await previous;
   try{
    const authenticated=valid(bearer);await db.exec('set role '+(authenticated?'authenticated':'anon'));
    await db.query("select set_config('request.jwt.claim.sub',$1,false)",[authenticated?userId:'']);
    await db.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify(authenticated?claims:{role:'anon',aal:'aal1'})]);
    const resource=path.split('/').at(-1)!;let rows:any[];
    if(path.includes('/rpc/')){
     const signatures:Record<string,string[]>={report_challenge:[],submit_signal:['p_challenge','p_nonce','p_barangay','p_onset','p_symptoms','p_note','p_consent','p_version','p_honeypot'],withdraw_signal:['p_code'],community_signal_aggregates:[],staff_signal_queue:[],staff_role:[],moderate_signal:['p_id','p_action','p_merge_into'],purge_community_retention:[]};
     if(!(resource in signatures))return await route.fulfill({status:404,json:{message:'Unknown local RPC'}});
     const names=signatures[resource],args=names.map(n=>data[n]??null),sql=names.map((n,i)=>`${n} => $${i+1}`).join(',');
     rows=(await db.query(`select * from public.${resource}(${sql})`,args)).rows;
     const scalar=['submit_signal','withdraw_signal','staff_role','moderate_signal','purge_community_retention'].includes(resource);
     return await route.fulfill({status:200,json:scalar?(rows[0]?.[resource]??null):rows});
    }
    const resources=['reporting_v2_policy','manila_barangay_catalog','community_signals','community_reports','staff_audit','surveillance_uploads'];
    if(!resources.includes(resource))return await route.fulfill({status:403,json:{message:'Denied local test resource'}});
    // Actual RLS/grants apply; the adapter does not substitute expected report rows.
    rows=(await db.query('select * from public.'+resource)).rows;
    return await route.fulfill({status:200,json:request.headers().accept?.includes('application/vnd.pgrst.object')?(rows[0]??null):rows});
   }catch(error){return await route.fulfill({status:403,json:{code:(error as {code?:string}).code??'42501',message:'Local database denied the request'}});}
   finally{await db.exec('reset role');unlock();}
  });
 }
 return {db,email,password,attach,dataset:'LOCAL TEST DATA ONLY',async ageReports(){await serial;await db.exec("update public.community_signals set created_at=now()-interval '4 days'");},async close(){await serial;await db.close();}};
}
