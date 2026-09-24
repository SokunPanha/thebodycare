-- 0006_add_review_functions — approve and reject a draft as one atomic step each. (MVP.md M5.3)
--
-- Approving touches the post, its topic_queue row and its topic_matrix cell. Doing that from the
-- app as three updates could leave a published post whose topic still says "drafted". These
-- functions do it in one transaction, and they check the caller is staff themselves — they are
-- security definer because staff have no write policy on the pipeline tables.

-- Why a post was rejected (or any other note from review). Shown in admin, never on the site.
alter table public.posts add column review_note text;

-- ---------------------------------------------------------------------------
-- approve_post — in_review → published
-- ---------------------------------------------------------------------------
create or replace function public.approve_post(p_post_id uuid)
returns table (slug text, category_slug text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_post public.posts%rowtype;
  v_source_count int;
begin
  if not private.is_staff() then
    raise exception 'Only staff can approve posts' using errcode = '42501';
  end if;

  select * into v_post from public.posts where id = p_post_id for update;
  if not found then
    raise exception 'Post not found' using errcode = 'P0002';
  end if;
  if v_post.status <> 'in_review' then
    raise exception 'Only posts in review can be approved (this one is %)', v_post.status
      using errcode = 'P0001';
  end if;

  -- EDITORIAL.md §5: at least three sources, each with a URL and publisher.
  select count(*) into v_source_count from public.post_sources where post_id = p_post_id;
  if v_source_count < 3 then
    raise exception 'Needs at least 3 sources to publish (has %)', v_source_count
      using errcode = 'P0001';
  end if;

  update public.posts set
    status         = 'published',
    published_at   = coalesce(published_at, now()),
    reviewer_id    = (select auth.uid()),
    reviewed_at    = now(),
    -- A named human has now read it: the trust bar may say so. (EDITORIAL.md §7)
    source         = case when source = 'ai' then 'ai_reviewed'::public.post_source else source end,
    -- The shorter re-review cycle until content types are distinguished. (OPERATIONS.md §4)
    next_review_at = now() + interval '12 months',
    review_note    = null
  where id = p_post_id;

  update public.topic_queue tq set status = 'published'
  from public.generation_runs r
  where r.post_id = p_post_id and tq.id = r.topic_id;

  update public.topic_matrix m set status = 'published'
  from public.generation_runs r
  join public.topic_queue tq on tq.id = r.topic_id
  where r.post_id = p_post_id and m.id = tq.matrix_id;

  return query
    select p.slug, c.slug
    from public.posts p join public.categories c on c.id = p.category_id
    where p.id = p_post_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- reject_post — in_review → archived, with a reason
-- The topic is marked rejected; its matrix cell is left for the pipeline to decide (M4), since a
-- quality rejection may deserve a retry where a duplicate never does.
-- ---------------------------------------------------------------------------
create or replace function public.reject_post(p_post_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.post_status;
begin
  if not private.is_staff() then
    raise exception 'Only staff can reject posts' using errcode = '42501';
  end if;
  if p_reason is null or char_length(btrim(p_reason)) = 0 then
    raise exception 'A reason is required' using errcode = 'P0001';
  end if;

  select status into v_status from public.posts where id = p_post_id for update;
  if not found then
    raise exception 'Post not found' using errcode = 'P0002';
  end if;
  if v_status <> 'in_review' then
    raise exception 'Only posts in review can be rejected (this one is %)', v_status
      using errcode = 'P0001';
  end if;

  update public.posts set status = 'archived', review_note = btrim(p_reason) where id = p_post_id;

  update public.topic_queue tq set status = 'rejected', reject_reason = btrim(p_reason)
  from public.generation_runs r
  where r.post_id = p_post_id and tq.id = r.topic_id;
end;
$$;

-- Signed-in users only; the functions themselves check for staff.
revoke execute on function public.approve_post(uuid) from public, anon;
revoke execute on function public.reject_post(uuid, text) from public, anon;
grant execute on function public.approve_post(uuid) to authenticated;
grant execute on function public.reject_post(uuid, text) to authenticated;
