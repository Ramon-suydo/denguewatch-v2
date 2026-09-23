-- Published surveillance and private, explicitly appointed administrators.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table private.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  appointed_at timestamptz not null default now()
);
alter table private.admin_users enable row level security;
revoke all on private.admin_users from public, anon, authenticated;

create function private.is_admin() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (
  select 1 from private.admin_users where user_id = (select auth.uid())
); $$;
revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

create table public.lgus (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(btrim(name)) between 1 and 100),
  psgc_code text unique check (psgc_code ~ '^[0-9]{10}$'),
  population integer check (population > 0),
  population_year smallint check (population_year between 1900 and 2200),
  population_source text,
  is_active boolean not null default true
);

create table public.historical_surveillance (
  id bigint generated always as identity primary key,
  lgu_id uuid not null references public.lgus(id),
  period_start date not null,
  period_type text not null check (period_type in ('week','month','day')),
  cases integer not null check (cases >= 0),
  deaths integer check (deaths >= 0),
  source text not null check (length(btrim(source)) > 0),
  source_citation text not null default 'TODO: exact DOH/FOI dataset citation',
  ingested_at timestamptz not null default now(),
  -- Extra provenance avoids inventing time boundaries or hiding source problems.
  period_date_semantics text not null default 'source_date_label'
    check (period_date_semantics in ('source_date_label','calendar_month_start','calendar_day')),
  population integer check (population > 0),
  population_year smallint,
  incidence_per_100k numeric(14,4) check (incidence_per_100k >= 0),
  weeks_reported smallint check (weeks_reported between 1 and 6),
  quality_flags text[] not null default '{}',
  source_sha256 text not null check (source_sha256 ~ '^[a-f0-9]{64}$'),
  unique (lgu_id, period_start, period_type, source),
  check (period_type <> 'month' or extract(day from period_start) = 1)
);
comment on column public.historical_surveillance.period_start is
'Weekly dates preserve source labels; week-start versus week-end is unconfirmed. Do not silently shift them.';
comment on column public.historical_surveillance.deaths is
'NULL means not reported. Source deaths exceeding cases are retained with quality flags, not corrected.';

create table public.historical_forecast_backtest (
  id bigint generated always as identity primary key,
  lgu_id uuid not null references public.lgus(id),
  method_version text not null check (length(btrim(method_version)) > 0),
  test_period_start date not null,
  period_type text not null check (period_type in ('week','month','day')),
  source text not null,
  predicted_cases numeric(14,4) not null
    check (predicted_cases >= 0 and predicted_cases <> 'NaN'::numeric),
  actual_cases integer not null check (actual_cases >= 0),
  absolute_error numeric(14,4) generated always as
    (abs(predicted_cases - actual_cases)) stored,
  computed_at timestamptz not null default now(),
  unique (lgu_id, method_version, test_period_start, period_type, source)
);

alter table public.lgus enable row level security;
alter table public.historical_surveillance enable row level security;
alter table public.historical_forecast_backtest enable row level security;
revoke all on public.lgus, public.historical_surveillance,
  public.historical_forecast_backtest from public, anon, authenticated;
grant select on public.lgus, public.historical_surveillance,
  public.historical_forecast_backtest to anon, authenticated;
grant insert, update, delete on public.lgus, public.historical_surveillance,
  public.historical_forecast_backtest to authenticated;
revoke all on sequence public.historical_surveillance_id_seq,
  public.historical_forecast_backtest_id_seq from public, anon, authenticated;
grant usage on sequence public.historical_surveillance_id_seq,
  public.historical_forecast_backtest_id_seq to authenticated;

create policy lgus_public_read on public.lgus for select to anon, authenticated using (true);
create policy historical_public_read on public.historical_surveillance for select to anon, authenticated using (true);
create policy backtest_public_read on public.historical_forecast_backtest for select to anon, authenticated using (true);
create policy lgus_admin_write on public.lgus for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy historical_admin_write on public.historical_surveillance for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy backtest_admin_write on public.historical_forecast_backtest for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

create index historical_source_period_idx on public.historical_surveillance(source, period_type, period_start);
