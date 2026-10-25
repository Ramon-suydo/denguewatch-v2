import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile,readdir } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { applyPendingMigrations } from '../scripts/lib/migrations.mjs';
import { findPlaceholders } from '../scripts/validate-shipped-data.mjs';
test('fresh migration chain protects retention RPC and provides an hourly schedule definition',async()=>{
 const db=new PGlite();
 const migrationDb={query:async(sql:string,params?:any[])=>params?db.query(sql,params):(await db.exec(sql)).at(-1)};
 try{
 await db.exec("create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema public,auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;alter default privileges in schema public grant all on tables to anon,authenticated,service_role;alter default privileges in schema public grant all on sequences to anon,authenticated,service_role;");
 await applyPendingMigrations(migrationDb);
 const count=(await db.query<{n:number}>('select count(*)::int n from supabase_migrations.schema_migrations')).rows[0].n;
 assert.equal(count,(await readdir('supabase/migrations')).filter(x=>x.endsWith('.sql')).length);
 await applyPendingMigrations(migrationDb);
 assert.equal((await db.query<{n:number}>('select count(*)::int n from supabase_migrations.schema_migrations')).rows[0].n,count);
 await db.exec('set role anon');await assert.rejects(db.query('select public.purge_community_retention()'));await db.exec('reset role;set role authenticated');await assert.rejects(db.query('select public.purge_community_retention()'));await db.exec('reset role;set role service_role');
 assert.equal((await db.query<{n:number}>('select public.purge_community_retention() n')).rows[0].n,0);await db.exec('reset role');
 const workflow=await readFile('.github/workflows/retention.yml','utf8');assert.match(workflow,/17 \* \* \* \*/);assert.match(workflow,/scripts\/purge-retention.mjs/);
 const original=await readFile('supabase/migrations/20261025000100_reporting_and_staff.sql','utf8');assert.match(original,/cron.schedule\('denguewatch-community-retention'/);
 const defaultCitation=(await db.query<{column_default:string}>("select column_default from information_schema.columns where table_schema='public' and table_name='historical_surveillance' and column_name='source_citation'")).rows[0].column_default;assert.equal(findPlaceholders(defaultCitation),false);
 }finally{await db.close();}
});
test('shipped attribution/filler gate rejects unresolved template text without rejecting honest unknowns',()=>{
 for(const text of ['TO'+'DO: exact dataset citation','FIX'+'ME: citation','lorem ipsum','T'+'BD','example'+'.com'])assert.equal(findPlaceholders(text),true);
 assert.equal(findPlaceholders('Original retrieval date unknown; formal citation pending data owner.'),false);
});
