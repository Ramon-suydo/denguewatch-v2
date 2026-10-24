-- Local review migration only. Never enables reporting or changes official data.
create table private.staff_roles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 role text not null check(role in ('moderator','admin'))
);
alter table private.staff_roles enable row level security;
revoke all on private.staff_roles from public,anon,authenticated;
create function public.staff_role() returns text language sql stable security definer set search_path='' as $$
 select case when exists(select 1 from private.admin_users where user_id=auth.uid()) then 'admin'
 else (select role from private.staff_roles where user_id=auth.uid()) end;
$$;
revoke all on function public.staff_role() from public,anon;
grant execute on function public.staff_role() to authenticated;

create table public.reporting_v2_policy (
 id boolean primary key default true check(id),
 enabled boolean not null default false,
 consent_version text not null default 'community-v2' check(consent_version='community-v2'),
 retention_days integer not null default 90 check(retention_days=90),
 publication_delay_hours integer not null default 72 check(publication_delay_hours>=72)
);
insert into public.reporting_v2_policy(id) values(true);
alter table public.reporting_v2_policy enable row level security;
revoke all on public.reporting_v2_policy from public,anon,authenticated;
grant select on public.reporting_v2_policy to anon,authenticated;
create policy v2_policy_read on public.reporting_v2_policy for select to anon,authenticated using(true);
create table public.manila_barangay_catalog(code text primary key,label text not null,source text not null);
alter table public.manila_barangay_catalog enable row level security;
revoke all on public.manila_barangay_catalog from public,anon,authenticated;
grant select on public.manila_barangay_catalog to anon,authenticated;
create policy barangay_catalog_read on public.manila_barangay_catalog for select to anon,authenticated using(true);

create table private.report_challenges(id uuid primary key default gen_random_uuid(),salt text not null,
 created_at timestamptz not null default now(),used boolean not null default false);
alter table private.report_challenges enable row level security;
revoke all on private.report_challenges from public,anon,authenticated;
create table public.community_signals (
 id uuid primary key default gen_random_uuid(),code_hash text not null unique,
 barangay_code text references public.manila_barangay_catalog(code),
 onset_date date not null,symptoms text[] not null default '{}',note_text text,
 consent_version text not null check(consent_version='community-v2'),consent_at timestamptz not null default now(),
 created_at timestamptz not null default now(),moderation text not null default 'pending' check(moderation in ('pending','quarantined','approved','rejected','merged')),
 duplicate_hash text not null,merged_into uuid references public.community_signals(id) on delete set null,withdrawn_at timestamptz,
 check(length(note_text)<=250),check(array_length(symptoms,1)<=6),check(length(code_hash)=64)
);
create index signals_created_idx on public.community_signals(created_at);
create index signals_duplicate_idx on public.community_signals(duplicate_hash,created_at);
alter table public.community_signals enable row level security;
revoke all on public.community_signals from public,anon,authenticated;
-- Raw SELECT is not granted, even to staff; audited queue RPC only.
create policy signals_staff_read on public.community_signals for select to authenticated using((select public.staff_role()) in ('moderator','admin'));
create table public.staff_audit (
 id bigint generated always as identity primary key,actor uuid not null,action text not null,
 record_id uuid,at timestamptz not null default now()
);
alter table public.staff_audit enable row level security;
revoke all on sequence public.staff_audit_id_seq from public,anon,authenticated;
revoke all on public.staff_audit from public,anon,authenticated;
grant select on public.staff_audit to authenticated;
create policy audit_admin_read on public.staff_audit for select to authenticated using((select public.staff_role())='admin');

create function private.scrub_signal_note(value text) returns text language plpgsql immutable set search_path='' as $$
declare cleaned text;
begin
 if value is null then return null;end if;
 if length(value)>250 then raise exception 'Note is too long' using errcode='22023';end if;
 -- Address-like text is discarded completely; unknown names/addresses remain a DPO review risk.
 if value ~* '(street|road|avenue|apartment|house|purok|sitio|address|brgy|barangay|unit[[:space:]]+[0-9])' then return null;end if;
 cleaned:=regexp_replace(value,'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}','[email removed]','g');
 cleaned:=regexp_replace(cleaned,'\+?[0-9][0-9 ()-]{6,}[0-9]','[phone removed]','g');
 cleaned:=regexp_replace(cleaned,'<[^>]*>','','g');
 return nullif(btrim(cleaned),'');
end;$$;
revoke all on function private.scrub_signal_note(text) from public,anon,authenticated;

create function public.report_challenge() returns table(challenge_id uuid,salt text,difficulty integer)
language plpgsql security definer set search_path='' as $$
declare c private.report_challenges;
begin
 if not exists(select 1 from public.reporting_v2_policy where id and enabled) then raise exception 'Collection is closed';end if;
 perform pg_advisory_xact_lock(84621025);
 delete from private.report_challenges where created_at<now()-interval '10 minutes';
 if (select count(*) from private.report_challenges where created_at>now()-interval '1 minute')>=200 then raise exception 'Please try later';end if;
 insert into private.report_challenges(salt) values(replace(gen_random_uuid()::text,'-','')) returning * into c;
 return query select c.id,c.salt,16;
end;$$;
revoke all on function public.report_challenge() from public;
grant execute on function public.report_challenge() to anon,authenticated;

create function public.submit_signal(p_challenge uuid,p_nonce text,p_barangay text,p_onset date,p_symptoms text[],p_note text,p_consent boolean,p_version text,p_honeypot text default '')
returns text language plpgsql security definer set search_path='' as $$
declare c private.report_challenges;cleaned text;fingerprint text;tracking text;state text:='pending';
begin
 if not exists(select 1 from public.reporting_v2_policy where id and enabled) then raise exception 'Collection is closed';end if;
 if p_consent is distinct from true or p_version is distinct from 'community-v2' or coalesce(p_honeypot,'')<>'' then raise exception 'Invalid submission' using errcode='22023';end if;
 if p_onset is null or p_onset>(now() at time zone 'Asia/Manila')::date or p_onset<(now() at time zone 'Asia/Manila')::date-90 then raise exception 'Onset must be within the last 90 days' using errcode='22023';end if;
 if p_symptoms is null or not(p_symptoms <@ array['fever','headache','body-ache','nausea','rash','other']) or cardinality(p_symptoms)>6 then raise exception 'Invalid symptoms' using errcode='22023';end if;
 if p_barangay is not null and not exists(select 1 from public.manila_barangay_catalog where code=p_barangay) then raise exception 'Choose a listed Manila area' using errcode='22023';end if;
 cleaned:=private.scrub_signal_note(p_note);
 if p_nonce is null or p_nonce !~ '^[0-9]{1,20}$' then raise exception 'Invalid challenge' using errcode='22023';end if;
 select * into c from private.report_challenges where id=p_challenge for update;
 if not found or c.used or c.created_at<now()-interval '5 minutes' or left(encode(sha256(convert_to(c.id::text||':'||c.salt||':'||p_nonce,'UTF8')),'hex'),4)<>'0000' then raise exception 'Invalid challenge' using errcode='22023';end if;
 perform pg_advisory_xact_lock(84621026);
 if (select count(*) from public.community_signals where created_at>now()-interval '1 minute')>=30 then raise exception 'Please try later';end if;
 fingerprint:=encode(sha256(convert_to(coalesce(p_barangay,'MANILA')||'|'||p_onset::text||'|'||array_to_string(array(select distinct x from unnest(p_symptoms) x order by x),','),'UTF8')),'hex');
 if exists(select 1 from public.community_signals where duplicate_hash=fingerprint and created_at>now()-interval '24 hours')
 or (select count(*) from public.community_signals where barangay_code is not distinct from p_barangay and created_at>now()-interval '5 minutes')>=3 then state:='quarantined';end if;
 tracking:='DW2-'||upper(replace(gen_random_uuid()::text,'-',''));
 insert into public.community_signals(code_hash,barangay_code,onset_date,symptoms,note_text,consent_version,duplicate_hash,moderation)
 values(encode(sha256(convert_to(tracking,'UTF8')),'hex'),p_barangay,p_onset,p_symptoms,cleaned,p_version,fingerprint,state);
 update private.report_challenges set used=true where id=c.id;
 return tracking;
end;$$;
revoke all on function public.submit_signal(uuid,text,text,date,text[],text,boolean,text,text) from public;
grant execute on function public.submit_signal(uuid,text,text,date,text[],text,boolean,text,text) to anon,authenticated;

create function public.withdraw_signal(p_code text) returns void language plpgsql security definer set search_path='' as $$
begin
 if p_code is null or length(p_code)>64 then return;end if;
 update public.community_signals set withdrawn_at=now(),note_text=null,symptoms='{}',barangay_code=null
 where code_hash=encode(sha256(convert_to(upper(btrim(p_code)),'UTF8')),'hex') and withdrawn_at is null;
end;$$;
revoke all on function public.withdraw_signal(text) from public;
grant execute on function public.withdraw_signal(text) to anon,authenticated;
create function public.community_signal_aggregates() returns table(area_label text,week_start date,report_count bigint)
language sql stable security definer set search_path='' as $$
 select coalesce(b.label,'Manila city (area not specified)'),date_trunc('week',s.onset_date::timestamp)::date,count(*)
 from public.community_signals s left join public.manila_barangay_catalog b on b.code=s.barangay_code
 where s.withdrawn_at is null and s.moderation='approved' and s.created_at<=now()-interval '72 hours'
 and s.created_at>now()-interval '90 days'
 group by s.barangay_code,b.label,date_trunc('week',s.onset_date::timestamp) having count(*)>=3;
$$;
revoke all on function public.community_signal_aggregates() from public;
grant execute on function public.community_signal_aggregates() to anon,authenticated;

create function public.moderate_signal(p_id uuid,p_action text,p_merge_into uuid default null) returns void
language plpgsql security definer set search_path='' as $$
begin
 if coalesce(public.staff_role(),'') not in ('moderator','admin') then raise exception 'Staff access required' using errcode='42501';end if;
 if p_action not in ('approved','rejected','merged') then raise exception 'Invalid action' using errcode='22023';end if;
 if p_action='merged' and (p_merge_into is null or p_merge_into=p_id or not exists(select 1 from public.community_signals where id=p_merge_into and withdrawn_at is null and moderation='approved')) then raise exception 'Select an approved merge target' using errcode='22023';end if;
 update public.community_signals set moderation=p_action,merged_into=case when p_action='merged' then p_merge_into else null end where id=p_id and withdrawn_at is null;
 if not found then raise exception 'Report unavailable';end if;
 insert into public.staff_audit(actor,action,record_id) values(auth.uid(),'signal_'||p_action,p_id);
end;$$;
revoke all on function public.moderate_signal(uuid,text,uuid) from public,anon;
grant execute on function public.moderate_signal(uuid,text,uuid) to authenticated;
create function public.staff_signal_queue() returns setof public.community_signals language plpgsql security definer set search_path='' as $$
begin
 if coalesce(public.staff_role(),'') not in ('moderator','admin') then raise exception 'Staff access required' using errcode='42501';end if;
 insert into public.staff_audit(actor,action) values(auth.uid(),'view_signal_queue');
 return query select * from public.community_signals where withdrawn_at is null order by created_at desc limit 200;
end;$$;
revoke all on function public.staff_signal_queue() from public,anon;
grant execute on function public.staff_signal_queue() to authenticated;

create table public.surveillance_uploads(id uuid primary key default gen_random_uuid(),citation text not null check(length(citation) between 8 and 1000),
 rows jsonb not null check(jsonb_typeof(rows)='array'),status text not null default 'draft' check(status in ('draft','published','rolled_back')),created_by uuid not null,created_at timestamptz not null default now());
alter table public.surveillance_uploads enable row level security;
revoke all on public.surveillance_uploads from public,anon,authenticated;
grant select on public.surveillance_uploads to authenticated;
create policy uploads_admin_read on public.surveillance_uploads for select to authenticated using((select public.staff_role())='admin');
create function public.stage_surveillance_upload(p_rows jsonb,p_citation text) returns uuid language plpgsql security definer set search_path='' as $$
declare item jsonb;identifier uuid;seen text[]:='{}';key text;date_value date;
begin
 if public.staff_role() is distinct from 'admin' then raise exception 'Admin access required' using errcode='42501';end if;
 if jsonb_typeof(p_rows) is distinct from 'array' or jsonb_array_length(p_rows)<1 or jsonb_array_length(p_rows)>5000 then raise exception 'Supply 1 to 5000 rows' using errcode='22023';end if;
 for item in select * from jsonb_array_elements(p_rows) loop
  if (select count(*) from jsonb_object_keys(item))<>3 or not(item ?& array['city','week_ending','cases']) or not exists(select 1 from public.lgus where name=item->>'city') or coalesce(item->>'cases','')!~ '^[0-9]{1,7}$' or coalesce(item->>'week_ending','')!~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then raise exception 'Invalid upload schema' using errcode='22023';end if;
  date_value:=(item->>'week_ending')::date;
  if extract(dow from date_value)<>0 or date_value>(now() at time zone 'Asia/Manila')::date or date_value<'1900-01-01' then raise exception 'Invalid Sunday source date' using errcode='22023';end if;
  key:=(item->>'city')||'|'||(item->>'week_ending');if key=any(seen) then raise exception 'Duplicate city/date' using errcode='22023';end if;seen:=array_append(seen,key);
 end loop;
 insert into public.surveillance_uploads(citation,rows,created_by) values(p_citation,p_rows,auth.uid()) returning id into identifier;
 insert into public.staff_audit(actor,action,record_id) values(auth.uid(),'stage_upload',identifier);return identifier;
end;$$;
revoke all on function public.stage_surveillance_upload(jsonb,text) from public,anon;
grant execute on function public.stage_surveillance_upload(jsonb,text) to authenticated;
create function public.set_upload_status(p_id uuid,p_status text) returns void language plpgsql security definer set search_path='' as $$
begin
 if public.staff_role() is distinct from 'admin' then raise exception 'Admin access required' using errcode='42501';end if;
 if p_status not in ('published','rolled_back') then raise exception 'Invalid upload state' using errcode='22023';end if;
 update public.surveillance_uploads set status=p_status where id=p_id and ((status='draft' and p_status='published') or (status='published' and p_status='rolled_back'));
 if not found then raise exception 'Invalid upload transition';end if;
 insert into public.staff_audit(actor,action,record_id) values(auth.uid(),'upload_'||p_status,p_id);
end;$$;
revoke all on function public.set_upload_status(uuid,text) from public,anon;
grant execute on function public.set_upload_status(uuid,text) to authenticated;
-- Exports are explicit. Publishing a reviewed upload does not silently retrain a frozen model.
create function public.reviewed_upload_series() returns table(upload_id uuid,citation text,city text,week_ending date,cases integer)
language sql stable security definer set search_path='' as $$
 select u.id,u.citation,item->>'city',(item->>'week_ending')::date,(item->>'cases')::integer
 from public.surveillance_uploads u cross join lateral jsonb_array_elements(u.rows) item where u.status='published';
$$;
revoke all on function public.reviewed_upload_series() from public;
grant execute on function public.reviewed_upload_series() to anon,authenticated;

create or replace function private.purge_expired_community_reports() returns bigint language plpgsql security definer set search_path='' as $$
declare legacy bigint;signals bigint;
begin
 delete from public.community_reports where created_at<=now()-interval '90 days';get diagnostics legacy=row_count;
 delete from public.community_signals where created_at<=now()-interval '90 days';get diagnostics signals=row_count;
 delete from private.report_challenges where created_at<=now()-interval '10 minutes';
 return legacy+signals;
end;$$;
-- Legacy submission entrypoint is permanently closed by this migration. Withdrawal remains available.
create or replace function public.submit_community_report(p_lgu_id uuid,p_report_date date,p_status text,p_consent_version text,p_consent_given boolean,p_barangay_text text default null,p_contact_opt_in boolean default false,p_contact_value text default null)
returns text language plpgsql security definer set search_path='' as $$begin raise exception 'Legacy collection is closed';end;$$;
create or replace function public.community_reports_weekly_agg() returns table(lgu_id uuid,week_start date,report_count bigint)
language sql stable security definer set search_path='' as $$ select null::uuid,null::date,0::bigint where false;$$;
-- Reuse the reviewed hourly job when pg_cron is available/preloaded. PGlite
-- intentionally lacks it; deployed scheduling/execution still needs verification.
do $retention$
begin
 if not exists(select 1 from pg_extension where extname='pg_cron')
 and exists(select 1 from pg_available_extensions where name='pg_cron')
 and coalesce(current_setting('shared_preload_libraries',true),'') like '%pg_cron%' then
  execute 'create extension if not exists pg_cron with schema pg_catalog';
 end if;
 if exists(select 1 from pg_extension where extname='pg_cron') then
  execute $job$select cron.schedule('denguewatch-community-retention','17 * * * *','select private.purge_expired_community_reports()')$job$;
 else
  raise notice 'pg_cron unavailable: retention job not scheduled; collection stays closed pending owner verification';
 end if;
end;
$retention$;
