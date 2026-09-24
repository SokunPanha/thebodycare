-- 0003_topic_matrix — the generation pipeline's fuel and its audit trail. (PLAN.md §3.2, §6)

-- ---------------------------------------------------------------------------
-- topic_matrix — category × subtopic × angle × audience × format. (TOPIC-MATRIX.md)
-- ---------------------------------------------------------------------------
create type public.matrix_status as enum ('open', 'queued', 'drafted', 'published', 'exhausted');

create table public.topic_matrix (
  id                uuid primary key default gen_random_uuid(),
  category_id       uuid not null references public.categories (id) on delete restrict,
  subtopic          text not null,
  -- Axes are text + CHECK rather than enums: extending them is a one-line migration either way,
  -- and CHECK constraints can be dropped and re-added inside a transaction.
  angle             text not null check (angle in (
                      'is-this-normal', 'what-is-happening', 'what-helps', 'why-it-happens-to-you',
                      'how-to-tell-the-difference', 'what-the-evidence-says', 'building-the-habit')),
  audience          text not null,
  format            text not null check (format in (
                      'explainer', 'is-it-normal', 'checklist', 'comparison', 'myth-check', 'timeline')),
  -- The search phrase, in the reader's words. What makes a cell a target rather than a subject.
  target_query      text not null unique,
  status            public.matrix_status not null default 'open',
  -- 1 is selected first.
  priority          smallint not null default 2 check (priority between 1 and 5),
  -- Derived from post_performance: cells whose siblings earn impressions get selected sooner.
  performance_score real not null default 0,
  embedding         extensions.vector(768),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (subtopic, angle, audience, format)
);

create trigger topic_matrix_set_updated_at
  before update on public.topic_matrix
  for each row execute function public.set_updated_at();

-- select-topic: open cells, best first.
create index topic_matrix_selection_idx on public.topic_matrix (status, priority, performance_score desc);
create index topic_matrix_category_idx on public.topic_matrix (category_id, status);
create index topic_matrix_hnsw_idx on public.topic_matrix
  using hnsw (embedding extensions.vector_cosine_ops);

-- ---------------------------------------------------------------------------
-- topic_queue — a concrete topic chosen from a cell, on its way to becoming a post.
-- ---------------------------------------------------------------------------
create type public.topic_status as enum ('pending', 'generating', 'drafted', 'rejected', 'published');

create table public.topic_queue (
  id             uuid primary key default gen_random_uuid(),
  matrix_id      uuid references public.topic_matrix (id) on delete set null,
  topic          text not null,
  target_keyword text not null,
  status         public.topic_status not null default 'pending',
  embedding      extensions.vector(768),
  -- Highest cosine similarity found by dedup gate 2, shown in the review queue.
  dedup_score    real,
  reject_reason  text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint topic_queue_rejected_has_reason check (status <> 'rejected' or reject_reason is not null)
);

create trigger topic_queue_set_updated_at
  before update on public.topic_queue
  for each row execute function public.set_updated_at();

create index topic_queue_status_idx on public.topic_queue (status, created_at);
create index topic_queue_hnsw_idx on public.topic_queue
  using hnsw (embedding extensions.vector_cosine_ops);

-- ---------------------------------------------------------------------------
-- generation_runs — one row per pipeline run. topic → prompt version → model → cost → post.
-- (STRUCTURE.md §6: every generated post is traceable.)
-- ---------------------------------------------------------------------------
create type public.run_status as enum ('running', 'success', 'failed', 'rejected', 'skipped');

create table public.generation_runs (
  id             uuid primary key default gen_random_uuid(),
  topic_id       uuid references public.topic_queue (id) on delete set null,
  post_id        uuid references public.posts (id) on delete set null,
  model          text not null,
  -- Rule 7: prompts are immutable, and every run records the version that produced it.
  prompt_version text not null,
  status         public.run_status not null default 'running',
  -- The pipeline step that failed or rejected, e.g. 'check-duplicate', 'guard-scope'.
  step           text,
  -- The scope guard's full verdict, shown in the review queue.
  scope_verdict  jsonb,
  tokens_in      integer not null default 0 check (tokens_in >= 0),
  tokens_out     integer not null default 0 check (tokens_out >= 0),
  cost_usd       numeric(10, 6) not null default 0 check (cost_usd >= 0),
  error          text,
  duration_ms    integer check (duration_ms >= 0),
  created_at     timestamptz not null default now(),
  finished_at    timestamptz
);

-- The daily cost cap sums today's runs before every model call.
create index generation_runs_created_at_idx on public.generation_runs (created_at desc);
create index generation_runs_post_id_idx on public.generation_runs (post_id);

alter table public.topic_matrix    enable row level security;
alter table public.topic_queue     enable row level security;
alter table public.generation_runs enable row level security;
