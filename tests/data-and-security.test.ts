import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { loadDataset, integer, isoDate, type Dataset } from '../scripts/lib/historical.ts';
import { normalizeLgu } from '../scripts/lib/geography.ts';
import { importDataset, type Database } from '../scripts/lib/import-database.ts';

const db = new PGlite();
const database: Database = { query: async (sql, values) => db.query(sql, values) };
const ADMIN = '00000000-0000-4000-8000-000000000001';
const VIEWER = '00000000-0000-4000-8000-000000000002';
let dataset: Dataset;
let lgu: string;
const reportDate = '2020-01-06';

async function asRole<T>(role: 'anon' | 'authenticated', id: string, fn: () => Promise<T>) {
  await db.exec(`set role ${role}`);
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id]);
  try { return await fn(); }
  finally { await db.exec('reset role'); await db.query("select set_config('request.jwt.claim.sub', '', false)"); }
}
async function submit(overrides: Record<string, unknown> = {}) {
  const p = { lgu, date: reportDate, status: 'self_suspected', version: 'community-v1', consent: true, barangay: null, optIn: false, contact: null, ...overrides };
  const result = await db.query<{ code: string }>(`select public.submit_community_report(
    $1::uuid,$2::date,$3::text,$4::text,$5::boolean,$6::text,$7::boolean,$8::text) as code`,
    [p.lgu,p.date,p.status,p.version,p.consent,p.barangay,p.optIn,p.contact]);
  return result.rows[0].code;
}

before(async () => {
  // Isolated test-only Supabase auth boundary. No hosted DB or persistent demo seed.
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth, public to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
    alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
    alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;`);
  for (const file of (await readdir('supabase/migrations')).filter(f => f.endsWith('.sql')).sort())
    await db.exec(await readFile(`supabase/migrations/${file}`, 'utf8'));
  await db.query('insert into auth.users(id) values ($1),($2)', [ADMIN, VIEWER]);
  await db.query('insert into private.admin_users(user_id) values ($1)', [ADMIN]);
  dataset = await loadDataset('data/raw');
  await importDataset(database, dataset);
  await db.exec("update public.community_policy set contact_email='research@example.test',submissions_enabled=true");
  lgu = (await db.query<{id:string}>("select id from public.lgus where name = 'MANILA CITY'")).rows[0].id;
});
after(async () => { await db.close(); });

test('real sources: coverage, gaps, anomalies and all six year-pairs', () => {
  assert.equal(dataset.observations.length, 7350);
  assert.equal(dataset.lgus.length, 17);
  assert.deepEqual(dataset.audit.summaries.map(s => s.deaths_exceed_cases), [41,155,0]);
  assert.deepEqual(dataset.audit.dailyYears.map(s => s.missing_dates.length), [6,12,170,49,13,31]);
  for (const lgu of dataset.audit.weeklyGaps)
    assert.deepEqual(lgu.missing_dates, ['2016-11-13','2019-01-06','2020-11-15']);
  const missing = dataset.observations.find(r => r.period_type === 'week' && r.lgu_name === 'QUEZON CITY' && r.period_start === '2017-05-07');
  assert.equal(missing?.deaths, null);
  assert.equal(dataset.observations.filter(r => r.period_type === 'day' && r.cases === 0).length, 0);
});

test('normalization and strict number/date validation', () => {
  assert.equal(normalizeLgu(' City of Las Pi\u00f1as '), 'LAS PINAS CITY');
  assert.equal(normalizeLgu('para\u00d1aque'), 'PARANAQUE CITY');
  assert.equal(normalizeLgu('Pateros'), 'PATEROS');
  assert.throws(() => normalizeLgu('Cebu City'));
  for (const value of ['',null,false,'-1','1.5','NaN','1e4']) assert.throws(() => integer(value,'test'));
  assert.throws(() => isoDate(2021,2,29));
  assert.equal(isoDate(2020,2,29), '2020-02-29');
});

test('rerun is idempotent; citations and unchanged ingestion timestamps survive', async () => {
  const before = await db.query('select id, ingested_at::text from public.historical_surveillance order by id');
  await db.query("update public.historical_surveillance set source_citation = 'Reviewed citation' where id = 1");
  await importDataset(database, dataset);
  assert.deepEqual((await db.query('select id, ingested_at::text from public.historical_surveillance order by id')).rows, before.rows);
  assert.equal((await db.query<{source_citation:string}>('select source_citation from public.historical_surveillance where id = 1')).rows[0].source_citation, 'Reviewed citation');
  await importDataset(database, dataset, true);
});

test('failed verification rolls back the whole import', async () => {
  const changed = structuredClone(dataset);
  changed.observations[0].cases++;
  changed.lgus[0].population++;
  await assert.rejects(importDataset(database, changed));
  await importDataset(database, dataset, true);
});

test('public tables are readable but anonymous and ordinary users cannot write', async () => {
  for (const role of ['anon','authenticated'] as const) {
    await asRole(role, role === 'anon' ? '' : VIEWER, async () => {
      assert.equal((await db.query('select * from public.lgus')).rows.length, 17);
      assert.equal((await db.query<{n:number}>('select count(*)::integer n from public.historical_surveillance')).rows[0].n, 7350);
      assert.equal((await db.query('select * from public.historical_forecast_backtest')).rows.length, 0);
      await assert.rejects(db.query("insert into public.lgus(name) values ('FORBIDDEN')"));
      await assert.rejects(db.query('insert into private.admin_users(user_id) values ($1)',[VIEWER]));
      await assert.rejects(db.query("insert into public.historical_forecast_backtest(lgu_id, method_version, test_period_start, period_type, source, predicted_cases, actual_cases) values ($1,'test','2020-01-01','month','test',3,5)",[lgu]));
    });
  }
});

test('admin writes work and backtest absolute error is database-derived', async () => {
  await asRole('authenticated', ADMIN, async () => {
    await db.query("insert into public.historical_forecast_backtest(lgu_id, method_version, test_period_start, period_type, source, predicted_cases, actual_cases) values ($1,'isolated-test','2020-01-01','month','isolated-test',3.5,5)",[lgu]);
    assert.equal(Number((await db.query<{absolute_error:string}>('select absolute_error from public.historical_forecast_backtest')).rows[0].absolute_error),1.5);
    await db.query("delete from public.historical_forecast_backtest where method_version = 'isolated-test'");
  });
});

test('community insert validates consent, status, dates, LGU, and optional contact', async () => {
  await asRole('anon','',async () => {
    await assert.rejects(submit({consent:false}));
    await assert.rejects(submit({consent:null}));
    await assert.rejects(submit({version:'unapproved'}));
    await assert.rejects(submit({status:'confirmed'}));
    await assert.rejects(submit({date:'2999-01-01'}));
    await assert.rejects(submit({lgu:'00000000-0000-4000-8000-000000000099'}));
    await assert.rejects(submit({contact:'not-opted-in@example.test'}));
    await assert.rejects(submit({optIn:null}));
    await assert.rejects(submit({barangay:'x'.repeat(101)}));
    await assert.rejects(db.query('insert into public.community_reports default values'));
  });
  await db.query('update public.lgus set is_active = false where id=$1',[lgu]);
  await asRole('anon','',async () => { await assert.rejects(submit()); });
  await db.query('update public.lgus set is_active = true where id=$1',[lgu]);
});

test('no public raw reads; groups below five suppressed; code withdrawal removes contact', async () => {
  const codes: string[] = [];
  await asRole('anon','',async () => {
    for (let i=0;i<4;i++) codes.push(await submit());
    assert.equal((await db.query('select * from public.community_reports_weekly_agg()')).rows.length,0);
    codes.push(await submit({optIn:true,contact:'isolated@example.test',barangay:'Test barangay'}));
    assert.match(codes[4], /^DW-[A-F0-9]{24}$/);
    const agg = (await db.query('select lgu_id, week_start::text, report_count::integer from public.community_reports_weekly_agg()')).rows;
    assert.deepEqual(agg,[{lgu_id:lgu,week_start:reportDate,report_count:5}]);
    await assert.rejects(db.query('select * from public.community_reports'));
    await assert.rejects(db.query<{reference_code:string}>('select reference_code from public.community_reports'));
  });
  await asRole('authenticated',VIEWER,async () => {
    assert.equal((await db.query('select * from public.community_reports')).rows.length,0);
    await assert.rejects(db.query('update public.community_reports set deleted_at=now()'));
  });
  await asRole('authenticated',ADMIN,async () => {
    const rows=(await db.query<{reference_code:string}>('select reference_code from public.community_reports')).rows;
    assert.equal(rows.length,5);
    for(const row of rows) assert.match(String(row.reference_code),/^[a-f0-9]{64}$/);
    assert.ok(rows.every(r=>!codes.includes(String(r.reference_code))));
  });
  await asRole('anon','',async () => {
    const invalid = await db.query('select public.delete_community_report($1)', ['DW-INVALID']);
    const valid = await db.query('select public.delete_community_report($1)', [codes[4].toLowerCase()]);
    const repeat = await db.query('select public.delete_community_report($1)', [codes[4]]);
    assert.deepEqual(invalid.rows,valid.rows);assert.deepEqual(valid.rows,repeat.rows);
    assert.equal((await db.query('select * from public.community_reports_weekly_agg()')).rows.length,0);
  });
  const deleted = (await db.query('select contact_value, contact_opt_in, barangay_text from public.community_reports where deleted_at is not null')).rows;
  assert.deepEqual(deleted,[{contact_value:null,contact_opt_in:false,barangay_text:null}]);
});

test('constraints also protect privileged direct writes', async () => {
  await assert.rejects(db.query("update public.community_reports set contact_opt_in=false, contact_value='forbidden'"));
  await assert.rejects(db.query("update public.community_reports set report_date='2999-01-01'"));
});

test('real-source forecasts persist for all cities and public users cannot change them or collection policy', async () => {
  const { refreshForecasts } = await import('../scripts/lib/forecast-cache.ts');
  const summaries=await refreshForecasts(database,'2026-09-24');
  assert.equal(summaries.length,17);
  assert.ok(summaries.every(row=>row.months>=24));
  assert.ok(summaries.every(row=>row.as_of && row.as_of<'2021-01-01'));
  const before=await db.query('select lgu_id,input_digest,predicted_cases from public.city_forecasts order by lgu_id');
  await refreshForecasts(database,'2026-09-24');
  assert.deepEqual((await db.query('select lgu_id,input_digest,predicted_cases from public.city_forecasts order by lgu_id')).rows,before.rows);
  await asRole('anon','',async()=>{
    assert.equal((await db.query('select * from public.city_forecasts')).rows.length,17);
    assert.equal((await db.query('select * from public.barangay_risk')).rows.length,17);
    await assert.rejects(db.query("update public.barangay_risk set inputs='{}'"),/permission denied/);
    await assert.rejects(db.query("insert into public.barangay_risk(lgu_id,inputs) values('00000000-0000-4000-8000-000000000099','{}')"),/permission denied/);
    assert.equal((await db.query("select * from public.historical_forecast_backtest where method_version like 'paired-%'")).rows.length,650);
    await assert.rejects(db.query('delete from public.city_forecasts'),/permission denied/);
    await assert.rejects(db.query('update public.community_policy set submissions_enabled=true'),/permission denied/);
    await assert.rejects(db.query('select private.purge_expired_community_reports()'),/permission denied/);
  });
});

test('collection gate and global daily ceiling apply to direct anonymous RPC calls', async () => {
  await db.exec('update public.community_policy set submissions_enabled=false');
  await assert.rejects(asRole('anon','',()=>submit()),/not open/);
  await db.exec('update public.community_policy set submissions_enabled=true');
  await assert.rejects(asRole('anon','',()=>submit({optIn:true,contact:null})),/contact value/);
  await db.query(`insert into public.community_reports(reference_code,lgu_id,report_date,status,consent_version,consent_at,created_at,deleted_at)
    select encode(sha256(convert_to('quota-test-'||n,'UTF8')),'hex'),$1,'2020-01-06','self_suspected','community-v1',now(),now(),now() from generate_series(1,100) n`,[lgu]);
  try {await assert.rejects(asRole('anon','',()=>submit()),/daily submission limit/);}
  finally {await db.query("delete from public.community_reports where reference_code in (select encode(sha256(convert_to('quota-test-'||n,'UTF8')),'hex') from generate_series(1,100) n)");}
});

test('expired rows are suppressed immediately and the owner cleanup removes them', async () => {
  await db.query(`insert into public.community_reports(reference_code,lgu_id,report_date,status,consent_version,consent_at,created_at,contact_opt_in,contact_value,barangay_text)
    select encode(sha256(convert_to('expiry-test-'||n,'UTF8')),'hex'),$1,'2024-04-01','self_suspected','community-v1',now()-interval '91 days',now()-interval '91 days',true,'expired@example.test','Sample barangay' from generate_series(1,5) n`,[lgu]);
  await asRole('anon','',async()=>assert.equal((await db.query("select * from public.community_reports_weekly_agg() where week_start='2024-04-01'")).rows.length,0));
  const result=await db.query<{removed:number}>('select private.purge_expired_community_reports()::integer as removed');
  assert.ok(result.rows[0].removed>=5);
  assert.equal((await db.query("select 1 from public.community_reports where contact_value='expired@example.test'")).rows.length,0);
});
