-- 0013_add_publish_unreviewed — "Publish all" in the review queue.
--
-- Owner's decision (2026-09-27): AI drafts that passed every automated check (sources, dedup,
-- scope guard) may go live without a human read. approve_post can't be used for that: it records
-- the staff member as reviewer and flips the post to 'ai_reviewed', so the article would say
-- "Reviewed by …" when nobody read it. This publishes with source 'ai' and no reviewer — the
-- trust bar then shows only the house byline. (EDITORIAL.md §7)
--
-- Takes the ids the editor was looking at, not "everything in review": drafts that land while the
-- page is open (the pipeline may be mid-batch) must not go live with covers nobody has seen.

create or replace function public.publish_unreviewed(p_post_ids uuid[])
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count int;
begin
  if not private.is_staff() then
    raise exception 'Only staff can publish posts' using errcode = '42501';
  end if;

  with ready as (
    select p.id
      from public.posts p
     where p.id = any (p_post_ids)
       and p.status = 'in_review'
       and p.source = 'ai'
       -- EDITORIAL.md §5, as approve_post: at least three sources.
       and (select count(*) from public.post_sources s where s.post_id = p.id) >= 3
     for update
  ), published as (
    update public.posts p set
      status         = 'published',
      published_at   = coalesce(p.published_at, now()),
      next_review_at = now() + interval '12 months',
      review_note    = null
    from ready where p.id = ready.id
    returning p.id
  ), topics as (
    update public.topic_queue tq set status = 'published'
      from public.generation_runs r, published
     where r.post_id = published.id and tq.id = r.topic_id
    returning tq.matrix_id
  ), cells as (
    update public.topic_matrix m set status = 'published'
      from topics where m.id = topics.matrix_id
    returning m.id
  )
  select count(*) into v_count from published;

  return v_count;
end;
$$;

revoke execute on function public.publish_unreviewed(uuid[]) from public, anon;
grant execute on function public.publish_unreviewed(uuid[]) to authenticated;
