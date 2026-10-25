-- Protected hourly fallback for plans without pg_cron. No reporting activation.
create function public.purge_community_retention() returns bigint
language sql security definer set search_path='' as $$
 select private.purge_expired_community_reports();
$$;
revoke all on function public.purge_community_retention() from public,anon,authenticated;
grant execute on function public.purge_community_retention() to service_role;
-- The prior migration schedules the DB job when pg_cron is available. Otherwise
-- .github/workflows/retention.yml invokes this RPC; deployed execution needs verification.
