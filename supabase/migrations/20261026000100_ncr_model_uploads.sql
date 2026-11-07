-- Forward-only reviewed NCR input versions. Does not enable community collection or retrain models.
create table public.ncr_model_uploads (
 id uuid primary key default gen_random_uuid(), citation text not null check(length(citation) between 8 and 1000),
 rows jsonb not null check(jsonb_typeof(rows)='array'),
 status text not null default 'draft' check(status in ('draft','published','rolled_back')),
 created_by uuid not null, created_at timestamptz not null default now(), published_at timestamptz
);
alter table public.ncr_model_uploads enable row level security;
revoke all on public.ncr_model_uploads from public,anon,authenticated;
grant select on public.ncr_model_uploads to authenticated;
create policy ncr_upload_admin_read on public.ncr_model_uploads for select to authenticated using((select public.staff_role())='admin');

create table private.ncr_model_cities(name text primary key);
alter table private.ncr_model_cities enable row level security;
revoke all on private.ncr_model_cities from public,anon,authenticated;
insert into private.ncr_model_cities(name) values
('CALOOCAN CITY'),('LAS PINAS CITY'),('MAKATI CITY'),('MALABON CITY'),('MANDALUYONG CITY'),('MANILA CITY'),('MARIKINA CITY'),('MUNTINLUPA CITY'),('NAVOTAS CITY'),('PARANAQUE CITY'),('PASAY CITY'),('PASIG CITY'),('PATEROS'),('QUEZON CITY'),('SAN JUAN CITY'),('TAGUIG CITY'),('VALENZUELA CITY');

create function private.validate_ncr_model_rows(p_rows jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare item jsonb; seen text[]:='{}'; key text; day date; first_day date; last_day date; weeks integer;
begin
 if jsonb_typeof(p_rows) is distinct from 'array' or jsonb_array_length(p_rows)<442 or jsonb_array_length(p_rows)>5000 then
  raise exception 'Supply at least 26 complete weeks for all 17 cities; maximum 5000 rows' using errcode='22023'; end if;
 for item in select * from jsonb_array_elements(p_rows) loop
  if jsonb_typeof(item) is distinct from 'object' then raise exception 'Invalid row' using errcode='22023'; end if;
  if (select count(*) from jsonb_object_keys(item))<>3 or not(item ?& array['city','week_ending','cases'])
   or not exists(select 1 from private.ncr_model_cities where name=item->>'city')
   or jsonb_typeof(item->'cases') is distinct from 'number' or coalesce(item->>'cases','')!~ '^[0-9]{1,6}$' or (item->>'cases')::integer>100000
   or coalesce(item->>'week_ending','')!~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
   raise exception 'Use known NCR cities, valid Sunday dates and counts 0 to 100000' using errcode='22023'; end if;
  day:=(item->>'week_ending')::date;
  if extract(dow from day)<>0 or day>(now() at time zone 'Asia/Manila')::date or day<'2016-01-10' then raise exception 'Invalid source date' using errcode='22023'; end if;
  key:=(item->>'city')||'|'||(item->>'week_ending');
  if key=any(seen) then raise exception 'Duplicate city/week' using errcode='22023'; end if;
  seen:=array_append(seen,key);
 end loop;
 if exists(select 1 from jsonb_array_elements(p_rows) r group by r->>'week_ending' having count(*)<>17) then raise exception 'Every week requires all 17 cities' using errcode='22023'; end if;
 select min((r->>'week_ending')::date),max((r->>'week_ending')::date),count(distinct r->>'week_ending') into first_day,last_day,weeks from jsonb_array_elements(p_rows) r;
 if (last_day-first_day)/7+1<>weeks then raise exception 'Weekly gaps are not allowed' using errcode='22023'; end if;
end;$$;
revoke all on function private.validate_ncr_model_rows(jsonb) from public,anon,authenticated;

create function public.stage_ncr_model_upload(p_rows jsonb,p_citation text) returns uuid
language plpgsql security definer set search_path='' as $$
declare identifier uuid;
begin
 if public.staff_role() is distinct from 'admin' then raise exception 'AAL2 admin access required' using errcode='42501'; end if;
 perform private.validate_ncr_model_rows(p_rows);
 if p_citation is null or length(p_citation) not between 8 and 1000 then raise exception 'A source citation is required' using errcode='22023'; end if;
 insert into public.ncr_model_uploads(citation,rows,created_by) values(p_citation,p_rows,auth.uid()) returning id into identifier;
 insert into public.staff_audit(actor,action,record_id) values(auth.uid(),'stage_ncr_model_upload',identifier);
 return identifier;
end;$$;
revoke all on function public.stage_ncr_model_upload(jsonb,text) from public,anon;
grant execute on function public.stage_ncr_model_upload(jsonb,text) to authenticated;

create function public.set_ncr_model_upload_status(p_id uuid,p_status text) returns void
language plpgsql security definer set search_path='' as $$
declare version public.ncr_model_uploads;
begin
 if public.staff_role() is distinct from 'admin' then raise exception 'AAL2 admin access required' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(20261026);
 select * into version from public.ncr_model_uploads where id=p_id for update;
 if not found or p_status not in ('published','rolled_back') or not((version.status='draft' and p_status='published') or(version.status='published' and p_status='rolled_back')) then raise exception 'Invalid version transition' using errcode='22023'; end if;
 if p_status='published' then perform private.validate_ncr_model_rows(version.rows); end if;
 update public.ncr_model_uploads set status=p_status,published_at=case when p_status='published' then clock_timestamp() else published_at end where id=p_id;
 insert into public.staff_audit(actor,action,record_id) values(auth.uid(),'ncr_model_'||p_status,p_id);
end;$$;
revoke all on function public.set_ncr_model_upload_status(uuid,text) from public,anon;
grant execute on function public.set_ncr_model_upload_status(uuid,text) to authenticated;

-- Latest published version only; rollback restores the previous published version.
-- Contains reviewed aggregate counts and citation, never staff identity or participant reports.
create function public.published_ncr_model_input() returns jsonb
language sql stable security definer set search_path='' as $$
 select jsonb_build_object('id',id,'citation',citation,'rows',rows,'published_at',published_at)
 from public.ncr_model_uploads where status='published' order by published_at desc,id desc limit 1;
$$;
revoke all on function public.published_ncr_model_input() from public;
grant execute on function public.published_ncr_model_input() to anon,authenticated;
