-- 0009_add_post_search — full-text search over published posts. (PLAN.md §9)
--
-- Weighted: a match in the title (A) outranks the standfirst (B), which outranks the body (C).
-- A stored generated column, so the index is always in step with the row — no trigger to forget.

alter table public.posts add column search_vector tsvector generated always as (
  setweight(to_tsvector('english', coalesce(title, '')), 'A')
  || setweight(to_tsvector('english', coalesce(excerpt, '')), 'B')
  || setweight(to_tsvector('english', coalesce(body_md, '')), 'C')
) stored;

create index posts_search_idx on public.posts using gin (search_vector);

-- Published posts matching a query, best first. websearch_to_tsquery accepts what people type:
-- plain words, "quoted phrases", -exclusions, `or`. It never raises on odd input.
-- security invoker: RLS applies, and the explicit status filter keeps drafts out for staff too.
create or replace function public.search_posts(query text, match_limit int default 20, match_offset int default 0)
returns table (post_id uuid, rank real, total bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  with q as (select websearch_to_tsquery('english', left(query, 200)) as tsq)
  select p.id, ts_rank_cd(p.search_vector, q.tsq) as rank, count(*) over () as total
  from public.posts p, q
  where p.status = 'published' and p.search_vector @@ q.tsq
  order by rank desc, p.published_at desc
  limit least(match_limit, 50)
  offset greatest(match_offset, 0);
$$;
