-- 0001_init — identity, taxonomy and content. (PLAN.md §6)
-- RLS is enabled here, with no policies: every table starts closed. Policies live in 0005.
-- MVP cut (MVP.md §1): no tags, comments, reactions, subscribers, cover images or view counts.

-- ---------------------------------------------------------------------------
-- Shared
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Identity
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('admin', 'editor', 'reader');

create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  bio          text,
  -- Shown with the reviewer's name in the trust bar, e.g. "RN, BSc Nutrition". (EDITORIAL.md §7)
  credentials  text,
  role         public.user_role not null default 'reader',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Every new auth user gets a reader profile. Promotion to admin is a manual SQL update.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Taxonomy
-- ---------------------------------------------------------------------------
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name        text not null unique,
  description text not null,
  sort_order  smallint not null default 0,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Content
-- ---------------------------------------------------------------------------
create type public.post_status as enum ('draft', 'in_review', 'published', 'archived');
-- human: written by a person · ai: generated, not yet read by a human · ai_reviewed: generated, then
-- human-reviewed. The trust bar must never imply a review that didn't happen. (EDITORIAL.md §7)
create type public.post_source as enum ('human', 'ai', 'ai_reviewed');

create table public.posts (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  -- 70-char cap: the display face breaks to four lines on mobile past it. (DESIGN.md §3)
  title             text not null check (char_length(title) between 1 and 70),
  -- The standfirst under the headline.
  excerpt           text not null check (char_length(excerpt) > 0),
  key_points        text[] not null check (cardinality(key_points) between 3 and 5),
  body_md           text not null,
  -- Required on every article, including pure lifestyle ones. (EDITORIAL.md §5)
  when_to_seek_care text not null check (char_length(btrim(when_to_seek_care)) > 0),
  -- [{ question, answer }] — feeds FAQPage JSON-LD.
  faq               jsonb not null default '[]'::jsonb check (jsonb_typeof(faq) = 'array'),

  category_id       uuid not null references public.categories (id) on delete restrict,
  author_id         uuid references public.profiles (id) on delete set null,
  reviewer_id       uuid references public.profiles (id) on delete set null,

  status            public.post_status not null default 'draft',
  source            public.post_source not null default 'human',

  seo_title         text check (char_length(seo_title) <= 60),
  seo_description   text check (char_length(seo_description) <= 155),
  reading_time_min  smallint not null default 1 check (reading_time_min > 0),

  reviewed_at       timestamptz,  -- "Last reviewed" in the trust bar
  next_review_at    timestamptz,  -- content re-review cycle (OPERATIONS.md §4)
  published_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint posts_published_has_date check (status <> 'published' or published_at is not null),
  constraint posts_ai_reviewed_has_reviewer check (source <> 'ai_reviewed' or reviewer_id is not null)
);

create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

-- The public listing query: newest published first.
create index posts_status_published_at_idx on public.posts (status, published_at desc);
create index posts_category_published_idx on public.posts (category_id, published_at desc)
  where status = 'published';

create table public.post_sources (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts (id) on delete cascade,
  url        text not null check (url ~ '^https?://'),
  title      text not null,
  publisher  text not null,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  unique (post_id, url)
);

create index post_sources_post_id_idx on public.post_sources (post_id, sort_order);

alter table public.profiles     enable row level security;
alter table public.categories   enable row level security;
alter table public.posts        enable row level security;
alter table public.post_sources enable row level security;
