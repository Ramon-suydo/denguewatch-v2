-- Forward-only anonymous coarse-report extension. Never enables collection.
create table public.reporting_area_catalog(name text primary key,source text not null);
alter table public.reporting_area_catalog enable row level security;
revoke all on public.reporting_area_catalog from public,anon,authenticated;
grant select on public.reporting_area_catalog to anon,authenticated;
create policy reporting_area_read on public.reporting_area_catalog for select to anon,authenticated using(true);
alter table public.community_signals add column report_type text check(report_type in ('suspected','cluster')) default 'suspected',add column area_unit text default 'MANILA CITY',add column affected_range text check(affected_range in ('1','2-4','5-9','10+')) default '1';
alter table public.community_signals alter column onset_date drop not null,alter column duplicate_hash drop not null;
create table private.report_hash_salt(id boolean primary key default true check(id),salt text not null);
insert into private.report_hash_salt values(true,replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-',''));
alter table private.report_hash_salt enable row level security;
revoke all on private.report_hash_salt from public,anon,authenticated;
create table private.report_rate_buckets(bucket_hash text primary key,expires_at timestamptz not null,submissions integer not null default 0);
alter table private.report_rate_buckets enable row level security;
revoke all on private.report_rate_buckets from public,anon,authenticated;
-- Route both the existing v2 RPC and the scoped v3 RPC through one throttle.
-- The original proof/consent/closed-policy implementation becomes private, not bypassable.
alter function public.submit_signal(uuid,text,text,date,text[],text,boolean,text,text) set schema private;
revoke all on function private.submit_signal(uuid,text,text,date,text[],text,boolean,text,text) from public,anon,authenticated;
create function public.submit_signal(p_challenge uuid,p_nonce text,p_barangay text,p_onset date,p_symptoms text[],p_note text,p_consent boolean,p_version text,p_honeypot text) returns text
language plpgsql security definer set search_path='' as $$
declare headers jsonb;client_ip text;bucket text;window_start bigint;
begin
 -- Do not persist headers, IP address, GPS, contact data or device identifiers.
 begin headers:=coalesce(nullif(current_setting('request.headers',true),''),'{}')::jsonb;exception when others then headers:='{}';end;
 client_ip:=coalesce(headers->>'cf-connecting-ip',split_part(headers->>'x-forwarded-for',',',1));
 if client_ip is not null and length(client_ip)<=64 then
  window_start:=floor(extract(epoch from now())/900)::bigint;
  bucket:=encode(sha256(convert_to((select salt from private.report_hash_salt where id)||'|'||window_start::text||'|'||client_ip,'UTF8')),'hex');client_ip:=null;headers:=null;
  delete from private.report_rate_buckets where expires_at<=now();
  insert into private.report_rate_buckets values(bucket,to_timestamp((window_start+1)*900),0) on conflict do nothing;
  perform 1 from private.report_rate_buckets where bucket_hash=bucket for update;
  if (select submissions from private.report_rate_buckets where bucket_hash=bucket)>=5 then raise exception 'Please try later';end if;
  update private.report_rate_buckets set submissions=submissions+1 where bucket_hash=bucket;
 end if;
 return private.submit_signal(p_challenge,p_nonce,p_barangay,p_onset,p_symptoms,p_note,p_consent,p_version,p_honeypot);
end;$$;
revoke all on function public.submit_signal(uuid,text,text,date,text[],text,boolean,text,text) from public;
grant execute on function public.submit_signal(uuid,text,text,date,text[],text,boolean,text,text) to anon,authenticated;
create function public.submit_signal_v3(p_challenge uuid,p_nonce text,p_barangay text,p_onset date,p_symptoms text[],p_note text,p_consent boolean,p_version text,p_honeypot text,p_report_type text,p_area_unit text,p_affected_range text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare tracking text;stored public.community_signals;cleaned text;
begin
 if p_report_type not in ('suspected','cluster') or p_report_type is null or p_affected_range not in ('1','2-4','5-9','10+') or p_affected_range is null or not exists(select 1 from public.reporting_area_catalog where name=p_area_unit) then raise exception 'Invalid coarse report fields' using errcode='22023';end if;
 if p_barangay is not null and p_area_unit<>'MANILA CITY' then raise exception 'Barangay catalogue is not available for that unit' using errcode='22023';end if;
 cleaned:=case when p_note ~* '(my name is|ako si|patient name|named[[:space:]]|names?:)' then null else p_note end;
 -- Existing proof, consent, closed policy, global ceiling, duplicate and burst safeguards stay authoritative.
 tracking:=public.submit_signal(p_challenge,p_nonce,p_barangay,p_onset,p_symptoms,cleaned,p_consent,p_version,p_honeypot);
 update public.community_signals set report_type=p_report_type,area_unit=p_area_unit,affected_range=p_affected_range,
 duplicate_hash=encode(sha256(convert_to(p_area_unit||'|'||p_report_type||'|'||p_onset::text||'|'||coalesce(p_barangay,'')||'|'||array_to_string(array(select distinct x from unnest(p_symptoms) x order by x),','),'UTF8')),'hex')
 where code_hash=encode(sha256(convert_to(tracking,'UTF8')),'hex') returning * into stored;
 if exists(select 1 from public.community_signals s where s.id<>stored.id and s.duplicate_hash=stored.duplicate_hash and s.created_at>now()-interval '24 hours') then update public.community_signals set moderation='quarantined' where id=stored.id;end if;
 return jsonb_build_object('code',tracking,'stored',jsonb_build_object('report_type',stored.report_type,'area_unit',stored.area_unit,'barangay',coalesce((select label from public.manila_barangay_catalog where code=stored.barangay_code),'Not specified'),'onset_date',stored.onset_date,'affected_range',stored.affected_range,'symptoms',stored.symptoms,'note',stored.note_text,'retention_days',90));
end;$$;
revoke all on function public.submit_signal_v3(uuid,text,text,date,text[],text,boolean,text,text,text,text,text) from public;
grant execute on function public.submit_signal_v3(uuid,text,text,date,text[],text,boolean,text,text,text,text,text) to anon,authenticated;
create or replace function public.community_signal_aggregates() returns table(area_label text,week_start date,report_count bigint)
language sql stable security definer set search_path='' as $$
 select coalesce(b.label,s.area_unit,'Manila city (area not specified)'),date_trunc('week',s.onset_date::timestamp)::date,count(*)
 from public.community_signals s left join public.manila_barangay_catalog b on b.code=s.barangay_code
 where s.withdrawn_at is null and s.moderation='approved' and s.created_at<=now()-interval '72 hours' and s.created_at>now()-interval '90 days'
 group by s.area_unit,s.barangay_code,b.label,date_trunc('week',s.onset_date::timestamp) having count(*)>=3;
$$;
create or replace function public.withdraw_signal(p_code text) returns void language plpgsql security definer set search_path='' as $$
begin
 if p_code is null or length(p_code)>64 then return;end if;
 update public.community_signals set withdrawn_at=now(),onset_date=null,duplicate_hash=null,note_text=null,symptoms='{}',barangay_code=null,area_unit=null,report_type=null,affected_range=null
 where code_hash=encode(sha256(convert_to(upper(btrim(p_code)),'UTF8')),'hex') and withdrawn_at is null;
end;$$;
create or replace function private.purge_expired_community_reports() returns bigint language plpgsql security definer set search_path='' as $$
declare legacy bigint;signals bigint;
begin
 delete from public.community_reports where created_at<=now()-interval '90 days';get diagnostics legacy=row_count;
 delete from public.community_signals where created_at<=now()-interval '90 days';get diagnostics signals=row_count;
 delete from private.report_challenges where created_at<=now()-interval '10 minutes';
 delete from private.report_rate_buckets where expires_at<=now();
 return legacy+signals;
end;$$;

-- Coarse units exactly as recorded in the DOH source; spelling/administrative differences remain visible.
insert into public.reporting_area_catalog(name,source) values
('ABRA','DOH EPI source reporting-unit catalogue'),
('AGUSAN DEL NORTE','DOH EPI source reporting-unit catalogue'),
('AGUSAN DEL SUR','DOH EPI source reporting-unit catalogue'),
('AKLAN','DOH EPI source reporting-unit catalogue'),
('ALBAY','DOH EPI source reporting-unit catalogue'),
('ANGELES CITY','DOH EPI source reporting-unit catalogue'),
('ANTIQUE','DOH EPI source reporting-unit catalogue'),
('APAYAO','DOH EPI source reporting-unit catalogue'),
('AURORA','DOH EPI source reporting-unit catalogue'),
('BACOLOD CITY','DOH EPI source reporting-unit catalogue'),
('BAGUIO CITY','DOH EPI source reporting-unit catalogue'),
('BASILAN','DOH EPI source reporting-unit catalogue'),
('BASILIG CITY','DOH EPI source reporting-unit catalogue'),
('BATAAN','DOH EPI source reporting-unit catalogue'),
('BATANES','DOH EPI source reporting-unit catalogue'),
('BATANGAS','DOH EPI source reporting-unit catalogue'),
('BAYUGAN CITY','DOH EPI source reporting-unit catalogue'),
('BENGUET','DOH EPI source reporting-unit catalogue'),
('BILIRAN','DOH EPI source reporting-unit catalogue'),
('BOHOL','DOH EPI source reporting-unit catalogue'),
('BUKIDNON','DOH EPI source reporting-unit catalogue'),
('BULACAN','DOH EPI source reporting-unit catalogue'),
('BUTUAN CITY','DOH EPI source reporting-unit catalogue'),
('CABADBARAN CITY','DOH EPI source reporting-unit catalogue'),
('CAGAYAN','DOH EPI source reporting-unit catalogue'),
('CAGAYAN DE ORO CITY','DOH EPI source reporting-unit catalogue'),
('CALOOCAN CITY','DOH EPI source reporting-unit catalogue'),
('CAMARINES NORTE','DOH EPI source reporting-unit catalogue'),
('CAMARINES SUR','DOH EPI source reporting-unit catalogue'),
('CAMIGUIN','DOH EPI source reporting-unit catalogue'),
('CAPIZ','DOH EPI source reporting-unit catalogue'),
('CATANDUANES','DOH EPI source reporting-unit catalogue'),
('CAVITE','DOH EPI source reporting-unit catalogue'),
('CEBU','DOH EPI source reporting-unit catalogue'),
('CEBU CITY','DOH EPI source reporting-unit catalogue'),
('COTABATO CITY','DOH EPI source reporting-unit catalogue'),
('DAGUPAN CITY','DOH EPI source reporting-unit catalogue'),
('DAVAO CITY','DOH EPI source reporting-unit catalogue'),
('DAVAO DE ORO','DOH EPI source reporting-unit catalogue'),
('DAVAO DEL NORTE','DOH EPI source reporting-unit catalogue'),
('DAVAO DEL SUR','DOH EPI source reporting-unit catalogue'),
('DAVAO OCCIDENTAL','DOH EPI source reporting-unit catalogue'),
('DAVAO ORIENTAL','DOH EPI source reporting-unit catalogue'),
('DINAGAT ISLANDS','DOH EPI source reporting-unit catalogue'),
('EASTERN SAMAR','DOH EPI source reporting-unit catalogue'),
('GENERAL SANTOS CITY','DOH EPI source reporting-unit catalogue'),
('GUIMARAS','DOH EPI source reporting-unit catalogue'),
('IFUGAO','DOH EPI source reporting-unit catalogue'),
('ILIGAN CITY','DOH EPI source reporting-unit catalogue'),
('ILOCOS NORTE','DOH EPI source reporting-unit catalogue'),
('ILOCOS SUR','DOH EPI source reporting-unit catalogue'),
('ILOILO','DOH EPI source reporting-unit catalogue'),
('ILOILO CITY','DOH EPI source reporting-unit catalogue'),
('ISABELA','DOH EPI source reporting-unit catalogue'),
('ISABELA CITY','DOH EPI source reporting-unit catalogue'),
('KALINGA','DOH EPI source reporting-unit catalogue'),
('LA UNION','DOH EPI source reporting-unit catalogue'),
('LAGUNA','DOH EPI source reporting-unit catalogue'),
('LANAO DEL NORTE','DOH EPI source reporting-unit catalogue'),
('LANAO DEL SUR','DOH EPI source reporting-unit catalogue'),
('LAPU-LAPU CITY','DOH EPI source reporting-unit catalogue'),
('LAS PINAS CITY','DOH EPI source reporting-unit catalogue'),
('LEYTE','DOH EPI source reporting-unit catalogue'),
('LUCENA CITY','DOH EPI source reporting-unit catalogue'),
('MAGUINDANAO','DOH EPI source reporting-unit catalogue'),
('MAKATI CITY','DOH EPI source reporting-unit catalogue'),
('MALABON CITY','DOH EPI source reporting-unit catalogue'),
('MANDALUYONG CITY','DOH EPI source reporting-unit catalogue'),
('MANDAUE CITY','DOH EPI source reporting-unit catalogue'),
('MANILA CITY','DOH EPI source reporting-unit catalogue'),
('MARIKINA CITY','DOH EPI source reporting-unit catalogue'),
('MARINDUQUE','DOH EPI source reporting-unit catalogue'),
('MASBATE','DOH EPI source reporting-unit catalogue'),
('MISAMIS OCCIDENTAL','DOH EPI source reporting-unit catalogue'),
('MISAMIS ORIENTAL','DOH EPI source reporting-unit catalogue'),
('MOUNTAIN PROVINCE','DOH EPI source reporting-unit catalogue'),
('MUNTINLUPA CITY','DOH EPI source reporting-unit catalogue'),
('NAGA CITY','DOH EPI source reporting-unit catalogue'),
('NAVOTAS CITY','DOH EPI source reporting-unit catalogue'),
('NEGROS OCCIDENTAL','DOH EPI source reporting-unit catalogue'),
('NEGROS ORIENTAL','DOH EPI source reporting-unit catalogue'),
('NORTH COTABATO','DOH EPI source reporting-unit catalogue'),
('NORTHERN SAMAR','DOH EPI source reporting-unit catalogue'),
('NUEVA ECIJA','DOH EPI source reporting-unit catalogue'),
('NUEVA VISCAYA','DOH EPI source reporting-unit catalogue'),
('OCCIDENTAL MINDORO','DOH EPI source reporting-unit catalogue'),
('OLONGAPO CITY','DOH EPI source reporting-unit catalogue'),
('ORIENTAL MINDORO','DOH EPI source reporting-unit catalogue'),
('ORMOC CITY','DOH EPI source reporting-unit catalogue'),
('PALAWAN','DOH EPI source reporting-unit catalogue'),
('PAMPANGA','DOH EPI source reporting-unit catalogue'),
('PANGASINAN','DOH EPI source reporting-unit catalogue'),
('PARANAQUE CITY','DOH EPI source reporting-unit catalogue'),
('PASAY CITY','DOH EPI source reporting-unit catalogue'),
('PASIG CITY','DOH EPI source reporting-unit catalogue'),
('PATEROS','DOH EPI source reporting-unit catalogue'),
('PUERTO PRINCESA CITY','DOH EPI source reporting-unit catalogue'),
('QUEZON','DOH EPI source reporting-unit catalogue'),
('QUEZON CITY','DOH EPI source reporting-unit catalogue'),
('QUIRINO','DOH EPI source reporting-unit catalogue'),
('RIZAL','DOH EPI source reporting-unit catalogue'),
('ROMBLON','DOH EPI source reporting-unit catalogue'),
('SAMAR','DOH EPI source reporting-unit catalogue'),
('SAN JUAN CITY','DOH EPI source reporting-unit catalogue'),
('SANTIAGO CITY','DOH EPI source reporting-unit catalogue'),
('SARANGANI','DOH EPI source reporting-unit catalogue'),
('SISQUIJOR','DOH EPI source reporting-unit catalogue'),
('SORSOGON','DOH EPI source reporting-unit catalogue'),
('SOUTH COTABATO','DOH EPI source reporting-unit catalogue'),
('SOUTHERN LEYTE','DOH EPI source reporting-unit catalogue'),
('SULTAN KUDARAT','DOH EPI source reporting-unit catalogue'),
('SULU','DOH EPI source reporting-unit catalogue'),
('SURIGAO CITY','DOH EPI source reporting-unit catalogue'),
('SURIGAO DEL NORTE','DOH EPI source reporting-unit catalogue'),
('SURIGAO DEL SUR','DOH EPI source reporting-unit catalogue'),
('TACLOBAN','DOH EPI source reporting-unit catalogue'),
('TAGUIG CITY','DOH EPI source reporting-unit catalogue'),
('TANDAG CITY','DOH EPI source reporting-unit catalogue'),
('TARLAC','DOH EPI source reporting-unit catalogue'),
('TAWI-TAWI','DOH EPI source reporting-unit catalogue'),
('VALENZUELA CITY','DOH EPI source reporting-unit catalogue'),
('ZAMBALES','DOH EPI source reporting-unit catalogue'),
('ZAMBOANGA CITY','DOH EPI source reporting-unit catalogue'),
('ZAMBOANGA DEL NORTE','DOH EPI source reporting-unit catalogue'),
('ZAMBOANGA DEL SUR','DOH EPI source reporting-unit catalogue'),
('ZAMBOANGA SIBUGAY','DOH EPI source reporting-unit catalogue');
