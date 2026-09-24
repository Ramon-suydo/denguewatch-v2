-- Collection is disabled until the owner publishes a contact and enables it.
create table public.community_policy (
  id boolean primary key default true check (id),
  retention_days integer not null default 90 check (retention_days = 90),
  contact_email text check (contact_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  submissions_enabled boolean not null default false,
  consent_version text not null default 'community-v1' check (consent_version = 'community-v1'),
  check (not submissions_enabled or contact_email is not null)
);
insert into public.community_policy(id,contact_email) values(true,'achilleslang23@gmail.com');
alter table public.community_policy enable row level security;
revoke all on public.community_policy from public, anon, authenticated;
grant select on public.community_policy to anon, authenticated;
create policy community_policy_public_read on public.community_policy for select to anon, authenticated using (true);

create function private.purge_expired_community_reports() returns bigint
language plpgsql security definer set search_path = '' as $$
declare removed bigint;
begin
  delete from public.community_reports where created_at <= current_timestamp - interval '90 days';
  get diagnostics removed = row_count;
  return removed;
end; $$;
revoke all on function private.purge_expired_community_reports() from public, anon, authenticated;
create index community_created_at_idx on public.community_reports(created_at);

-- Every public entry path is guarded, including direct REST calls to the RPC.
-- A serialized global ceiling cannot be evaded by changing claimed IP, city, or
-- contact fields. It limits storage abuse, not report truthfulness or identity.
create or replace function public.submit_community_report(
  p_lgu_id uuid, p_report_date date, p_status text,
  p_consent_version text, p_consent_given boolean,
  p_barangay_text text default null, p_contact_opt_in boolean default false,
  p_contact_value text default null
) returns text language plpgsql security definer set search_path = '' as $$
declare deletion_code text := 'DW-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 24));
begin
  if not exists (select 1 from public.community_policy where id and submissions_enabled and contact_email is not null) then
    raise exception 'Community submissions are not open yet.' using errcode = 'P0001';
  end if;
  if p_consent_given is distinct from true or p_consent_version is distinct from 'community-v1' then
    raise exception 'Explicit consent to the current notice is required' using errcode = '22023';
  end if;
  if p_contact_opt_in is null or (not p_contact_opt_in and p_contact_value is not null)
    or (p_contact_opt_in and nullif(btrim(p_contact_value),'') is null) then
    raise exception 'Contact details require explicit opt-in and a contact value.' using errcode = '22023';
  end if;
  if not exists (select 1 from public.lgus where id = p_lgu_id and is_active) then
    raise exception 'Select an active LGU' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(24092026);
  if (select count(*) from public.community_reports where created_at > current_timestamp - interval '24 hours') >= 100 then
    raise exception 'The daily submission limit has been reached. Please try tomorrow.' using errcode = 'P0001';
  end if;
  insert into public.community_reports(reference_code,lgu_id,barangay_text,report_date,status,contact_opt_in,contact_value,consent_version,consent_at)
  values(encode(sha256(convert_to(deletion_code,'UTF8')),'hex'), p_lgu_id, nullif(btrim(p_barangay_text),''),p_report_date,p_status,
    p_contact_opt_in,nullif(btrim(p_contact_value),''),p_consent_version,current_timestamp);
  return deletion_code;
end; $$;

create or replace function public.community_reports_weekly_agg()
returns table (lgu_id uuid, week_start date, report_count bigint)
language sql stable security definer set search_path = '' as $$
  select r.lgu_id, date_trunc('week', r.report_date::timestamp)::date, count(*)
  from public.community_reports r
  where r.deleted_at is null and r.created_at > current_timestamp - interval '90 days'
  group by r.lgu_id, date_trunc('week', r.report_date::timestamp)::date
  having count(*) >= 5;
$$;
-- Replaced functions preserve grants. Expired records immediately disappear from
-- aggregates, even if the hourly purge is delayed. Hosted setup schedules purge;
-- disposable PostgreSQL tests invoke it explicitly.
