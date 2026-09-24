-- 0005_add_rls_policies — who can read and write what. (PLAN.md §6, TESTING.md §3)
--
-- Every table already has RLS enabled with no policies, so anything not granted below is denied.
-- The generation pipeline writes with the service role, which bypasses RLS — so pipeline tables
-- need read policies for the admin screens and nothing more.
--
-- Principle: anon sees published content and nothing else. An unpublished post is invisible, not
-- an error (R2).

-- ---------------------------------------------------------------------------
-- Role helpers. In a non-exposed schema so they aren't callable over the Data API.
-- security definer: they read profiles without recursing through profiles' own RLS.
-- ---------------------------------------------------------------------------
create schema if not exists private;
grant usage on schema private to anon, authenticated;

create or replace function private.has_role(roles public.user_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = any (roles)
  );
$$;

create or replace function private.is_staff()
returns boolean
language sql
stable
set search_path = ''
as $$ select private.has_role(array['admin', 'editor']::public.user_role[]); $$;

create or replace function private.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$ select private.has_role(array['admin']::public.user_role[]); $$;

-- ---------------------------------------------------------------------------
-- profiles
-- Staff profiles are public: the reviewer's name and credentials appear in the trust bar.
-- Nobody updates their own row — that would let a reader set role = 'admin'.
-- ---------------------------------------------------------------------------
create policy "profiles: read own, staff, or any staff member's public profile"
  on public.profiles for select to anon, authenticated
  using (
    id = (select auth.uid())
    or role in ('admin', 'editor')
    or (select private.is_staff())
  );

create policy "profiles: admins update"
  on public.profiles for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
create policy "categories: anyone reads"
  on public.categories for select to anon, authenticated
  using (true);

create policy "categories: admins write"
  on public.categories for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- ---------------------------------------------------------------------------
-- posts
-- ---------------------------------------------------------------------------
create policy "posts: published are public, staff see all"
  on public.posts for select to anon, authenticated
  using (status = 'published' or (select private.is_staff()));

create policy "posts: staff insert"
  on public.posts for insert to authenticated
  with check ((select private.is_staff()));

create policy "posts: staff update"
  on public.posts for update to authenticated
  using ((select private.is_staff()))
  with check ((select private.is_staff()));

create policy "posts: admins delete"
  on public.posts for delete to authenticated
  using ((select private.is_admin()));

-- ---------------------------------------------------------------------------
-- post_sources — visible exactly when their post is.
-- ---------------------------------------------------------------------------
create policy "post_sources: follow the post"
  on public.post_sources for select to anon, authenticated
  using (
    (select private.is_staff())
    or exists (
      select 1 from public.posts p
      where p.id = post_sources.post_id and p.status = 'published'
    )
  );

create policy "post_sources: staff write"
  on public.post_sources for all to authenticated
  using ((select private.is_staff()))
  with check ((select private.is_staff()));

-- ---------------------------------------------------------------------------
-- post_embeddings — readable for published posts so related_posts() works for anon.
-- Written only by the pipeline (service role).
-- ---------------------------------------------------------------------------
create policy "post_embeddings: follow the post"
  on public.post_embeddings for select to anon, authenticated
  using (
    (select private.is_staff())
    or exists (
      select 1 from public.posts p
      where p.id = post_embeddings.post_id and p.status = 'published'
    )
  );

-- ---------------------------------------------------------------------------
-- Pipeline + analytics tables — staff read only. They leak cost, prompt and strategy data (R8).
-- ---------------------------------------------------------------------------
create policy "topic_matrix: staff read"
  on public.topic_matrix for select to authenticated
  using ((select private.is_staff()));

-- Admins mark cells exhausted or reprioritise them from /admin/topics.
create policy "topic_matrix: admins update"
  on public.topic_matrix for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "topic_queue: staff read"
  on public.topic_queue for select to authenticated
  using ((select private.is_staff()));

create policy "generation_runs: staff read"
  on public.generation_runs for select to authenticated
  using ((select private.is_staff()));

create policy "post_performance: staff read"
  on public.post_performance for select to authenticated
  using ((select private.is_staff()));
