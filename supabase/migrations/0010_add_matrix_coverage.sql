-- 0010_add_matrix_coverage — topic matrix coverage for /admin/topics. (MVP.md M5.6, PLAN.md §7)
--
-- Per category: cells by status, and by format — TOPIC-MATRIX.md §3 flags the seed as 54%
-- `explainer`, and the admin view needs to show whether new cells are fixing that.

create or replace function public.topic_matrix_coverage()
returns table (
  category_id uuid,
  category_slug text,
  category_name text,
  by_status jsonb,
  by_format jsonb,
  total bigint
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  if not private.is_staff() then
    raise exception 'Only staff can read matrix coverage' using errcode = '42501';
  end if;

  return query
    select
      c.id,
      c.slug,
      c.name,
      coalesce((
        select jsonb_object_agg(s.status, s.n)
        from (select m.status, count(*) as n from public.topic_matrix m
              where m.category_id = c.id group by m.status) s
      ), '{}'::jsonb),
      coalesce((
        select jsonb_object_agg(f.format, f.n)
        from (select m.format, count(*) as n from public.topic_matrix m
              where m.category_id = c.id group by m.format) f
      ), '{}'::jsonb),
      (select count(*) from public.topic_matrix m where m.category_id = c.id)
    from public.categories c
    order by c.sort_order;
end;
$$;

revoke execute on function public.topic_matrix_coverage() from public, anon;
grant execute on function public.topic_matrix_coverage() to authenticated;
