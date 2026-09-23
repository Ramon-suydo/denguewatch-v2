-- Run in Supabase SQL Editor after migrations and npm run ingest.
select source, period_type, count(*) as rows,
       count(distinct lgu_id) as lgus,
       min(period_start) as first_date, max(period_start) as last_date,
       sum(cases) as source_cases,
       count(*) filter (where deaths is null) as unknown_death_rows
from public.historical_surveillance
group by source, period_type order by period_type;

select count(*) as lgu_count from public.lgus;
select l.name, h.period_type, count(*) as rows
from public.historical_surveillance h join public.lgus l on l.id = h.lgu_id
group by l.name, h.period_type order by l.name, h.period_type;

-- Must return zero rows.
select lgu_id, period_start, period_type, source, count(*)
from public.historical_surveillance
group by lgu_id, period_start, period_type, source having count(*) > 1;

-- Must all be false for anon table access, true for the aggregate RPC.
select has_table_privilege('anon','public.community_reports','SELECT') as anon_raw_read,
       has_table_privilege('anon','public.community_reports','INSERT') as anon_direct_insert,
       has_table_privilege('anon','public.community_reports','UPDATE') as anon_direct_update,
       has_table_privilege('anon','public.community_reports','DELETE') as anon_direct_delete,
       has_function_privilege('anon','public.community_reports_weekly_agg()','EXECUTE') as anon_aggregate;

select n.nspname, c.relname, c.relrowsecurity
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where (n.nspname='public' and c.relname in
  ('lgus','historical_surveillance','historical_forecast_backtest','community_reports'))
  or (n.nspname='private' and c.relname='admin_users');

-- Read as an actual anon database role; do not test only as SQL Editor owner.
begin;
set local role anon;
select count(*) as published_rows from public.historical_surveillance;
select * from public.community_reports_weekly_agg();
rollback;
