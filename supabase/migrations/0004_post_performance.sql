-- 0004_post_performance — weekly Search Console numbers per post. (GROWTH.md §6)
-- Ships now so the table exists; the sync job is wired around month 2, once pages index.

create table public.post_performance (
  post_id      uuid not null references public.posts (id) on delete cascade,
  week_of      date not null check (extract(isodow from week_of) = 1),  -- the Monday
  impressions  integer not null default 0 check (impressions >= 0),
  clicks       integer not null default 0 check (clicks >= 0),
  avg_position real,
  source       text not null default 'gsc' check (source in ('gsc')),
  synced_at    timestamptz not null default now(),
  primary key (post_id, week_of)
);

alter table public.post_performance enable row level security;
