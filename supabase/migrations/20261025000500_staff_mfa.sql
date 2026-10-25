-- Staff identity and MFA are verified by Supabase Auth / PostgREST JWT claims.
-- A browser cannot appoint a role or turn an AAL1 session into AAL2.
create or replace function public.staff_role() returns text
language sql stable security definer set search_path='' as $$
 select case when coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'aal','')<>'aal2' then null
 when exists(select 1 from private.admin_users where user_id=auth.uid()) then 'admin'
 else (select role from private.staff_roles where user_id=auth.uid()) end;
$$;
revoke all on function public.staff_role() from public,anon;
grant execute on function public.staff_role() to authenticated;
