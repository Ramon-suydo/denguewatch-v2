-- Computed by the owner-only JS refresh job, never by anonymous page loads.
create table public.city_forecasts (
  lgu_id uuid primary key references public.lgus(id),
  source text not null,
  method_version text not null,
  data_as_of date,
  forecast_for date,
  valid_until date,
  latest_observation date,
  predicted_cases double precision check (predicted_cases >= 0 and predicted_cases < 'Infinity'::double precision),
  p50 double precision,
  p80 double precision,
  risk_label text not null check (risk_label in ('Low','Medium','High','Insufficient data')),
  baseline_count integer not null check (baseline_count >= 0),
  baseline_start date,
  baseline_end date,
  input_periods jsonb not null,
  reason text not null,
  input_digest text not null,
  computed_at timestamptz not null default now()
);
alter table public.city_forecasts enable row level security;
revoke all on public.city_forecasts from public, anon, authenticated;
grant select on public.city_forecasts to anon, authenticated;
create policy forecast_public_read on public.city_forecasts for select to anon, authenticated using (true);
comment on table public.city_forecasts is 'Historical WMA estimates, not current alerts. Consumers must check forecast_for and valid_until. Refresh with npm run forecast:refresh after ingestion.';
create index historical_lgu_period_idx on public.historical_surveillance(lgu_id, period_type, period_start, id);
