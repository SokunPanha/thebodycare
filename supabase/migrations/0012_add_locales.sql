-- 0012_add_locales — multi-language content. (PLAN.md §6a)
--
-- Every language-specific row gets a `locale`, defaulting to 'en', so everything written before
-- this migration — and every caller that doesn't pass a locale yet — keeps working unchanged.
-- Adding a language later is data (a `locales` row, category translations, matrix cells), not a
-- migration, unless Postgres has a stemmer for it that search should use (see search_config).
--
-- Decisions:
--   - Slugs stay globally unique. A translated article gets its own slug in its own language; the
--     URL carries the locale later (/km/posts/…), so no two rows ever need the same slug.
--   - Translations of one article share `translation_group_id` (one row per locale in a group).
--   - Search, dedup and related posts stay within one language: a Khmer article about sleep is a
--     translation, not a duplicate, of the English one — and an English reader wants English results.

-- ---------------------------------------------------------------------------
-- Locales
-- ---------------------------------------------------------------------------
create table public.locales (
  -- BCP 47: 'en', 'km', 'pt-BR'.
  code        text primary key check (code ~ '^[a-z]{2,3}(-[A-Z]{2})?$'),
  name        text not null,          -- in English, for the admin: "Khmer"
  native_name text not null,          -- for readers: "ខ្មែរ"
  is_default  boolean not null default false,
  -- Off until there's content to show; the site only lists enabled locales.
  enabled     boolean not null default false,
  sort_order  smallint not null default 0,
  created_at  timestamptz not null default now()
);

-- Exactly one default.
create unique index locales_one_default on public.locales (is_default) where is_default;

insert into public.locales (code, name, native_name, is_default, enabled, sort_order)
values ('en', 'English', 'English', true, true, 1);

alter table public.locales enable row level security;
create policy "locales: public read" on public.locales for select to anon, authenticated using (true);

-- The text-search configuration for a locale. Generated columns need an IMMUTABLE expression, so
-- this is a fixed mapping rather than a lookup; languages without a Postgres stemmer (Khmer, Thai,
-- Vietnamese…) use 'simple' — exact-word matching, no stemming.
create or replace function public.search_config(p_locale text)
returns regconfig
language sql
immutable
parallel safe
set search_path = ''
as $$
  select case split_part(p_locale, '-', 1)
    when 'en' then 'pg_catalog.english'
    when 'fr' then 'pg_catalog.french'
    when 'es' then 'pg_catalog.spanish'
    when 'de' then 'pg_catalog.german'
    when 'pt' then 'pg_catalog.portuguese'
    when 'it' then 'pg_catalog.italian'
    when 'nl' then 'pg_catalog.dutch'
    when 'id' then 'pg_catalog.indonesian'
    else 'pg_catalog.simple'
  end::regconfig;
$$;

-- ---------------------------------------------------------------------------
-- Posts
-- ---------------------------------------------------------------------------
alter table public.posts
  add column locale text not null default 'en' references public.locales (code) on update cascade,
  -- Translations of one article share a group. A new article starts its own group.
  add column translation_group_id uuid not null default gen_random_uuid(),
  add constraint posts_one_per_locale_in_group unique (translation_group_id, locale);

create index posts_locale_published_idx on public.posts (locale, status, published_at desc);

-- Search: re-create the generated column so each row is indexed with its own language's rules.
drop index public.posts_search_idx;
alter table public.posts drop column search_vector;
alter table public.posts add column search_vector tsvector generated always as (
  setweight(to_tsvector(public.search_config(locale), coalesce(title, '')), 'A')
  || setweight(to_tsvector(public.search_config(locale), coalesce(excerpt, '')), 'B')
  || setweight(to_tsvector(public.search_config(locale), coalesce(body_md, '')), 'C')
) stored;
create index posts_search_idx on public.posts using gin (search_vector);

drop function public.search_posts(text, int, int);
create function public.search_posts(
  query text,
  match_limit int default 20,
  match_offset int default 0,
  p_locale text default 'en'
)
returns table (post_id uuid, rank real, total bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  with q as (select websearch_to_tsquery(public.search_config(p_locale), left(query, 200)) as tsq)
  select p.id, ts_rank_cd(p.search_vector, q.tsq) as rank, count(*) over () as total
  from public.posts p, q
  where p.status = 'published' and p.locale = p_locale and p.search_vector @@ q.tsq
  order by rank desc, p.published_at desc
  limit least(match_limit, 50)
  offset greatest(match_offset, 0);
$$;

-- ---------------------------------------------------------------------------
-- Categories: the base row is the default locale; other languages live here.
-- ---------------------------------------------------------------------------
create table public.category_translations (
  category_id uuid not null references public.categories (id) on delete cascade,
  locale      text not null references public.locales (code) on update cascade,
  name        text not null,
  description text not null,
  primary key (category_id, locale),
  unique (locale, name)
);

alter table public.category_translations enable row level security;
create policy "category_translations: public read"
  on public.category_translations for select to anon, authenticated using (true);

-- ---------------------------------------------------------------------------
-- Topic matrix and queue: a target query is a phrase in one language.
-- ---------------------------------------------------------------------------
alter table public.topic_matrix
  add column locale text not null default 'en' references public.locales (code) on update cascade,
  drop constraint topic_matrix_target_query_key,
  drop constraint topic_matrix_subtopic_angle_audience_format_key,
  add constraint topic_matrix_locale_target_query_key unique (locale, target_query),
  add constraint topic_matrix_locale_cell_key unique (locale, subtopic, angle, audience, format);

alter table public.topic_queue
  add column locale text not null default 'en' references public.locales (code) on update cascade;

-- ---------------------------------------------------------------------------
-- Related posts (0002): neighbours in the same language only.
-- ---------------------------------------------------------------------------
drop function public.related_posts(uuid, int);
drop function public.match_posts(extensions.vector, int, uuid);

create function public.match_posts(
  query_embedding extensions.vector(768),
  match_count int default 5,
  exclude_post_id uuid default null,
  p_locale text default 'en'
)
returns table (post_id uuid, similarity float8)
language sql
stable
security invoker
set search_path = ''
as $$
  select e.post_id, 1 - (e.embedding operator(extensions.<=>) query_embedding) as similarity
  from public.post_embeddings e
  join public.posts p on p.id = e.post_id
  where p.status = 'published'
    and p.locale = p_locale
    and (exclude_post_id is null or e.post_id <> exclude_post_id)
  order by e.embedding operator(extensions.<=>) query_embedding
  limit least(match_count, 50);
$$;

create function public.related_posts(target_post_id uuid, match_count int default 3)
returns table (post_id uuid, similarity float8)
language sql
stable
security invoker
set search_path = ''
as $$
  select m.post_id, m.similarity
  from public.post_embeddings e
  join public.posts t on t.id = e.post_id,
       lateral public.match_posts(e.embedding, match_count, target_post_id, t.locale) m
  where e.post_id = target_post_id;
$$;

-- ---------------------------------------------------------------------------
-- Pipeline functions (0011): dedup within a language; drafts and cells carry their locale.
-- ---------------------------------------------------------------------------
drop function public.nearest_content(extensions.vector, int, boolean);
create function public.nearest_content(
  query_embedding extensions.vector(768),
  match_count int default 5,
  include_topics boolean default true,
  p_locale text default 'en'
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
     where p.status <> 'archived' and p.locale = p_locale
  )
  union all
  (
    select 'topic', q.id, q.topic, null, null,
           1 - (q.embedding operator(extensions.<=>) query_embedding)
      from public.topic_queue q
     where include_topics and q.embedding is not null and q.locale = p_locale
       and q.status in ('pending', 'generating', 'drafted')
  )
  order by 6 desc
  limit least(match_count, 50);
$$;

drop function public.exact_duplicate(text, text);
create function public.exact_duplicate(p_title text, p_slug text, p_locale text default 'en')
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when exists (select 1 from public.posts where status <> 'archived' and locale = p_locale
                   and lower(btrim(title)) = lower(btrim(p_title)))
      or exists (select 1 from public.topic_queue where status in ('pending','generating','drafted')
                   and locale = p_locale and lower(btrim(topic)) = lower(btrim(p_title)))
      then 'exact_title'
    -- Slugs are global (see header), so this check is too.
    when exists (select 1 from public.posts where slug = p_slug)
      then 'exact_slug'
    else null
  end;
$$;

drop function public.claim_next_topic_cell();
create function public.claim_next_topic_cell()
returns table (
  id uuid, subtopic text, angle text, audience text, format text, target_query text,
  category_id uuid, category_name text, category_slug text, locale text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cell_id uuid;
begin
  -- Only cells in enabled languages: a language can be seeded ahead of launch.
  select m.id into v_cell_id
    from public.topic_matrix m
    join public.locales l on l.code = m.locale and l.enabled
   where m.status = 'open'
   order by m.priority asc, m.performance_score desc, random()
   limit 1
   for update of m skip locked;

  if v_cell_id is null then
    return;
  end if;

  update public.topic_matrix set status = 'queued' where topic_matrix.id = v_cell_id;

  return query
    select m.id, m.subtopic, m.angle, m.audience, m.format, m.target_query,
           c.id, coalesce(ct.name, c.name), c.slug, m.locale
      from public.topic_matrix m
      join public.categories c on c.id = m.category_id
      left join public.category_translations ct on ct.category_id = c.id and ct.locale = m.locale
     where m.id = v_cell_id;
end;
$$;

-- Same as 0011, plus the locale (default 'en' when the caller doesn't send one).
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
    status, source, seo_title, seo_description, reading_time_min, published_at, next_review_at,
    locale
  ) values (
    v_slug, p->>'title', p->>'excerpt',
    array(select jsonb_array_elements_text(p->'key_points')),
    p->>'body_md', p->>'when_to_seek_care', coalesce(p->'faq', '[]'::jsonb),
    (p->>'category_id')::uuid, v_status, 'ai',
    p->>'seo_title', p->>'seo_description', (p->>'reading_time_min')::smallint,
    case when v_status = 'published' then now() end,
    case when v_status = 'published' then now() + interval '12 months' end,
    coalesce(p->>'locale', 'en')
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

revoke execute on function public.claim_next_topic_cell() from public, anon, authenticated;
revoke execute on function public.nearest_content(extensions.vector, int, boolean, text) from public, anon, authenticated;
revoke execute on function public.exact_duplicate(text, text, text) from public, anon, authenticated;
revoke execute on function public.persist_draft(jsonb) from public, anon, authenticated;
