-- Historical city-scale explanations only: no barangay observations exist.
create table public.barangay_risk (
  lgu_id uuid primary key references public.lgus(id),
  scope text not null default 'city' check(scope='city'),
  inputs jsonb not null check(jsonb_typeof(inputs)='object'),
  computed_at timestamptz not null default now()
);
comment on table public.barangay_risk is 'City-scoped model inputs despite legacy requested table name. Never interpret as barangay-level risk. No private community counts are stored.';
alter table public.barangay_risk enable row level security;
revoke all on public.barangay_risk from public,anon,authenticated;
grant select on public.barangay_risk to anon,authenticated;
create policy risk_public_read on public.barangay_risk for select to anon,authenticated using(true);
