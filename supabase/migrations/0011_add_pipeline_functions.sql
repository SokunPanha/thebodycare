-- 0011_add_pipeline_functions — what the generation pipeline (M4) needs from the database.
-- Service role only: none of these are callable by anon or signed-in users.

-- ---------------------------------------------------------------------------
-- Run lock (TESTING.md G10: two cron runs overlap → the second exits, no duplicate post).
-- A run still 'running' after 15 minutes is a crashed run: mark it abandoned so it can't block
-- generation forever.
-- ---------------------------------------------------------------------------
create or replace function public.start_generation_run(p_model text, p_prompt_version text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  -- Serialise the check-and-insert across concurrent callers.
  perform pg_advisory_xact_lock(hashtext('generation_run'));

  update public.generation_runs
     set status = 'failed', error = 'Abandoned: still running after 15 minutes', finished_at = now()
   where status = 'running' and step is distinct from 'cover' and created_at < now() - interval '15 minutes';

  if exists (
    select 1 from public.generation_runs
     where status = 'running' and step is distinct from 'cover'
  ) then
    return null;
  end if;

  insert into public.generation_runs (model, prompt_version, status)
  values (p_model, p_prompt_version, 'running')
  returning id into v_id;
  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Topic selection (M4.5): the best open cell, claimed atomically. SKIP LOCKED means two
-- concurrent runs can never claim the same cell.
-- ---------------------------------------------------------------------------
create or replace function public.claim_next_topic_cell()
returns table (
  id uuid, subtopic text, angle text, audience text, format text, target_query text,
  category_id uuid, category_name text, category_slug text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cell_id uuid;
begin
  select m.id into v_cell_id
    from public.topic_matrix m
   where m.status = 'open'
   order by m.priority asc, m.performance_score desc, random()
   limit 1
   for update skip locked;

  if v_cell_id is null then
    return;
  end if;

  update public.topic_matrix set status = 'queued' where topic_matrix.id = v_cell_id;

  return query
    select m.id, m.subtopic, m.angle, m.audience, m.format, m.target_query,
           c.id, c.name, c.slug
      from public.topic_matrix m join public.categories c on c.id = m.category_id
     where m.id = v_cell_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Dedup gates 2–3 (PLAN.md §7): the nearest existing content to an embedding — published posts,
-- drafts awaiting review, and topics already in the queue. Similarity = 1 − cosine distance.
-- ---------------------------------------------------------------------------
create or replace function public.nearest_content(
  query_embedding extensions.vector(768),
  match_count int default 5,
  include_topics boolean default true
)
returns table (kind text, id uuid, title text, excerpt text, slug text, similarity float8)
language sql
stable
security definer
set search_path = ''
as $$
  (
    select 'post', p.id, p.title, p.excerpt, p.slug,
           1 - (e.embedding operator(extensions.<=>) query_embedding)
      from public.post_embeddings e
      join public.posts p on p.id = e.post_id
     where p.status <> 'archived'
  )
  union all
  (
    select 'topic', q.id, q.topic, null, null,
           1 - (q.embedding operator(extensions.<=>) query_embedding)
      from public.topic_queue q
     where include_topics and q.embedding is not null
       and q.status in ('pending', 'generating', 'drafted')
  )
  order by 6 desc
  limit least(match_count, 50);
$$;

-- Gate 1: an exact title or slug match against live content and queued topics.
create or replace function public.exact_duplicate(p_title text, p_slug text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when exists (select 1 from public.posts where status <> 'archived' and lower(btrim(title)) = lower(btrim(p_title)))
      or exists (select 1 from public.topic_queue where status in ('pending','generating','drafted') and lower(btrim(topic)) = lower(btrim(p_title)))
      then 'exact_title'
    when exists (select 1 from public.posts where slug = p_slug)
      then 'exact_slug'
    else null
  end;
$$;

-- ---------------------------------------------------------------------------
-- Cost cap: today's spend (UTC day — the same boundary as dashboard_stats, migration 0007).
-- ---------------------------------------------------------------------------
create or replace function public.spend_today_usd()
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum(cost_usd), 0)
    from public.generation_runs
   where created_at >= date_trunc('day', now() at time zone 'utc') at time zone 'utc';
$$;

-- A slug not yet taken: "sleep-tips", then "sleep-tips-2", "sleep-tips-3"…
create or replace function public.unique_post_slug(p_base text)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_slug text := p_base;
  v_n int := 1;
begin
  while exists (select 1 from public.posts where slug = v_slug) loop
    v_n := v_n + 1;
    v_slug := p_base || '-' || v_n;
  end loop;
  return v_slug;
end;
$$;

-- ---------------------------------------------------------------------------
-- Persist a finished draft (M4.9) — post, sources, embedding, topic and run — in ONE
-- transaction. TESTING.md G2: a malformed run must never leave a partial post behind.
-- ---------------------------------------------------------------------------
create or replace function public.persist_draft(p jsonb)
returns table (post_id uuid, slug text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_post_id uuid;
  v_slug text;
  v_status public.post_status := (p->>'status')::public.post_status;
begin
  v_slug := public.unique_post_slug(p->>'slug');

  insert into public.posts (
    slug, title, excerpt, key_points, body_md, when_to_seek_care, faq, category_id,
    status, source, seo_title, seo_description, reading_time_min, published_at, next_review_at
  ) values (
    v_slug, p->>'title', p->>'excerpt',
    array(select jsonb_array_elements_text(p->'key_points')),
    p->>'body_md', p->>'when_to_seek_care', coalesce(p->'faq', '[]'::jsonb),
    (p->>'category_id')::uuid, v_status, 'ai',
    p->>'seo_title', p->>'seo_description', (p->>'reading_time_min')::smallint,
    case when v_status = 'published' then now() end,
    case when v_status = 'published' then now() + interval '12 months' end
  )
  returning id into v_post_id;

  insert into public.post_sources (post_id, url, title, publisher, sort_order)
  select v_post_id, s->>'url', s->>'title', s->>'publisher', (ord - 1)::smallint
    from jsonb_array_elements(p->'sources') with ordinality as t(s, ord);

  insert into public.post_embeddings (post_id, embedding, content_hash, model)
  values (v_post_id, (p->>'embedding')::extensions.vector(768), p->>'content_hash', p->>'embedding_model');

  update public.topic_queue
     set status = 'drafted', dedup_score = (p->>'dedup_score')::real
   where id = (p->>'topic_id')::uuid;

  update public.topic_matrix set status = 'drafted' where id = (p->>'matrix_id')::uuid;

  update public.generation_runs
     set post_id = v_post_id, topic_id = (p->>'topic_id')::uuid, scope_verdict = p->'scope_verdict'
   where id = (p->>'run_id')::uuid;

  return query select v_post_id, v_slug;
end;
$$;

revoke execute on function public.start_generation_run(text, text) from public, anon, authenticated;
revoke execute on function public.claim_next_topic_cell() from public, anon, authenticated;
revoke execute on function public.nearest_content(extensions.vector, int, boolean) from public, anon, authenticated;
revoke execute on function public.exact_duplicate(text, text) from public, anon, authenticated;
revoke execute on function public.spend_today_usd() from public, anon, authenticated;
revoke execute on function public.unique_post_slug(text) from public, anon, authenticated;
revoke execute on function public.persist_draft(jsonb) from public, anon, authenticated;
