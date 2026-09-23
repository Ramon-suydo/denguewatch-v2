create table public.community_reports (
  id uuid primary key default gen_random_uuid(),
  reference_code text not null unique check (reference_code ~ '^[a-f0-9]{64}$'),
  lgu_id uuid not null references public.lgus(id),
  barangay_text text check (length(btrim(barangay_text)) between 1 and 100),
  report_date date not null,
  status text not null check (status in ('self_suspected','clinic_confirmed_self_report','recovered')),
  contact_opt_in boolean not null default false,
  contact_value text check (length(btrim(contact_value)) between 1 and 254),
  consent_version text not null check (length(btrim(consent_version)) between 1 and 64),
  consent_at timestamptz not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint contact_requires_opt_in check (contact_opt_in or contact_value is null)
);
comment on column public.community_reports.reference_code is
'SHA-256 of the one-time displayed bearer deletion code. Never expose a recovery/list endpoint.';
comment on table public.community_reports is
'Unverified community self-reports, never official case counts. clinic_confirmed_self_report is a user claim, not verified diagnosis.';

-- A trigger checks moving dates at write time, rather than a time-dependent CHECK.
create function private.validate_community_report() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.report_date > (current_timestamp at time zone 'Asia/Manila')::date then
    raise exception 'Report date cannot be in the future' using errcode = '22023';
  end if;
  if new.consent_at > current_timestamp then
    raise exception 'Consent timestamp cannot be in the future' using errcode = '22023';
  end if;
  return new;
end; $$;
revoke all on function private.validate_community_report() from public, anon, authenticated;
create trigger validate_community_report before insert or update on public.community_reports
for each row execute function private.validate_community_report();

alter table public.community_reports enable row level security;
revoke all on public.community_reports from public, anon, authenticated;
grant select on public.community_reports to authenticated;
create policy community_admin_read on public.community_reports for select to authenticated
using ((select private.is_admin()));

create function public.submit_community_report(
  p_lgu_id uuid, p_report_date date, p_status text,
  p_consent_version text, p_consent_given boolean,
  p_barangay_text text default null, p_contact_opt_in boolean default false,
  p_contact_value text default null
) returns text language plpgsql security definer set search_path = '' as $$
declare
  deletion_code text := 'DW-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 24));
begin
  if p_consent_given is distinct from true or p_consent_version is distinct from 'community-v1' then
    raise exception 'Explicit consent to the current notice is required' using errcode = '22023';
  end if;
  if p_contact_opt_in is null or (not p_contact_opt_in and p_contact_value is not null) then
    raise exception 'Contact details require explicit opt-in' using errcode = '22023';
  end if;
  if not exists (select 1 from public.lgus where id = p_lgu_id and is_active) then
    raise exception 'Select an active LGU' using errcode = '22023';
  end if;
  insert into public.community_reports (
    reference_code, lgu_id, barangay_text, report_date, status,
    contact_opt_in, contact_value, consent_version, consent_at
  ) values (
    encode(sha256(convert_to(deletion_code, 'UTF8')), 'hex'), p_lgu_id,
    nullif(btrim(p_barangay_text), ''), p_report_date, p_status,
    p_contact_opt_in, nullif(btrim(p_contact_value), ''), p_consent_version, current_timestamp
  );
  return deletion_code;
end; $$;

-- Possession of a high-entropy code authorizes only withdrawal, not row retrieval.
-- Always return the same result for missing, already-deleted, or valid codes.
create function public.delete_community_report(p_reference_code text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_reference_code is null or length(p_reference_code) > 64 then return; end if;
  update public.community_reports set deleted_at = current_timestamp,
    contact_opt_in = false, contact_value = null, barangay_text = null
  where reference_code = encode(sha256(convert_to(upper(btrim(p_reference_code)), 'UTF8')), 'hex')
    and deleted_at is null;
end; $$;

create function public.community_reports_weekly_agg()
returns table (lgu_id uuid, week_start date, report_count bigint)
language sql stable security definer set search_path = '' as $$
  select r.lgu_id, date_trunc('week', r.report_date::timestamp)::date, count(*)
  from public.community_reports r
  where r.deleted_at is null
  group by r.lgu_id, date_trunc('week', r.report_date::timestamp)::date
  having count(*) >= 5;
$$;

revoke all on function public.submit_community_report(uuid,date,text,text,boolean,text,boolean,text) from public, anon, authenticated;
revoke all on function public.delete_community_report(text) from public, anon, authenticated;
revoke all on function public.community_reports_weekly_agg() from public, anon, authenticated;
grant execute on function public.submit_community_report(uuid,date,text,text,boolean,text,boolean,text) to anon, authenticated;
grant execute on function public.delete_community_report(text) to anon, authenticated;
grant execute on function public.community_reports_weekly_agg() to anon, authenticated;

create index community_active_lgu_date_idx on public.community_reports(lgu_id, report_date)
where deleted_at is null;
