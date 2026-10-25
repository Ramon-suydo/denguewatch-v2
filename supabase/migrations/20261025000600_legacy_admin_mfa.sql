-- Forward-only: close legacy RLS paths as well as the current staff RPCs.
create or replace function private.is_admin() returns boolean
language sql stable security definer set search_path='' as $$
 select coalesce(public.staff_role()='admin',false);
$$;
revoke all on function private.is_admin() from public,anon;
grant execute on function private.is_admin() to authenticated;
