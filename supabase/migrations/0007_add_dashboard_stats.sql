-- 0007_add_dashboard_stats — the admin dashboard's numbers, computed in one round trip. (MVP.md M5.5)
--
-- "Today" is the UTC day. The generation pipeline's daily cost cap (M4) must use the same
-- boundary, or the dashboard and the cap will disagree about how much has been spent.

create or replace function public.dashboard_stats()
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_today timestamptz := date_trunc('day', now() at time zone 'utc') at time zone 'utc';
begin
  if not private.is_staff() then
    raise exception 'Only staff can read dashboard stats' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'posts_by_status', (
      select coalesce(jsonb_object_agg(status, n), '{}'::jsonb)
      from (select status, count(*) as n from public.posts group by status) s
    ),
    'oldest_in_review_at', (
      select min(created_at) from public.posts where status = 'in_review'
    ),
    'published_last_7d', (
      select count(*) from public.posts
      where status = 'published' and published_at >= now() - interval '7 days'
    ),
    'runs_last_7d', (
      select coalesce(jsonb_object_agg(status, n), '{}'::jsonb)
      from (
        select status, count(*) as n from public.generation_runs
        where created_at >= now() - interval '7 days'
        group by status
      ) r
    ),
    'spend_today_usd', (
      select coalesce(sum(cost_usd), 0) from public.generation_runs where created_at >= v_today
    ),
    'spend_30d_usd', (
      select coalesce(sum(cost_usd), 0) from public.generation_runs
      where created_at >= now() - interval '30 days'
    ),
    'matrix_by_status', (
      select coalesce(jsonb_object_agg(status, n), '{}'::jsonb)
      from (select status, count(*) as n from public.topic_matrix group by status) m
    ),
    'posts_due_for_review', (
      select count(*) from public.posts
      where status = 'published' and next_review_at <= now()
    )
  );
end;
$$;

revoke execute on function public.dashboard_stats() from public, anon;
grant execute on function public.dashboard_stats() to authenticated;
