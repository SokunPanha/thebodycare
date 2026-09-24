-- 0002_pgvector — embeddings for dedup gates 2–3 and related posts. (PLAN.md §7)
--
-- 768 dimensions: HNSW indexes on `vector` cap at 2,000 dims, so the embedding model is called
-- with an explicit output dimensionality of 768. Changing it means a new migration and a re-embed.

create extension if not exists vector with schema extensions;

create table public.post_embeddings (
  post_id      uuid primary key references public.posts (id) on delete cascade,
  embedding    extensions.vector(768) not null,
  -- sha256 of the embedded text, so an unchanged post is never re-embedded.
  content_hash text not null,
  model        text not null,
  created_at   timestamptz not null default now()
);

create index post_embeddings_hnsw_idx on public.post_embeddings
  using hnsw (embedding extensions.vector_cosine_ops);

alter table public.post_embeddings enable row level security;

-- Nearest published posts to an embedding, most similar first. Similarity is 1 - cosine distance.
-- security invoker: RLS still decides which rows the caller can see.
create or replace function public.match_posts(
  query_embedding extensions.vector(768),
  match_count int default 5,
  exclude_post_id uuid default null
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
    and (exclude_post_id is null or e.post_id <> exclude_post_id)
  order by e.embedding operator(extensions.<=>) query_embedding
  limit least(match_count, 50);
$$;

-- Related posts for an article page: its own embedding's nearest published neighbours.
create or replace function public.related_posts(target_post_id uuid, match_count int default 3)
returns table (post_id uuid, similarity float8)
language sql
stable
security invoker
set search_path = ''
as $$
  select m.post_id, m.similarity
  from public.post_embeddings e,
       lateral public.match_posts(e.embedding, match_count, target_post_id) m
  where e.post_id = target_post_id;
$$;
