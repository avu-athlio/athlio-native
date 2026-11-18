-- Training posts ("Post about training").
-- Run once in the Supabase SQL editor (or `supabase db push`).
-- Safe to re-run: every statement checks before it changes anything.

-- 1. A post can point at a logged training session.
alter table public.posts
  add column if not exists training_session_id uuid
  references public.training_sessions(id) on delete set null;

create index if not exists posts_training_session_id_idx
  on public.posts (training_session_id);

-- 2. Allow the new post type. (The original check only allowed basic/match.)
alter table public.posts drop constraint if exists posts_type_check;
alter table public.posts
  add constraint posts_type_check check (type in ('basic', 'match', 'training'));

-- 3. People who can see a training post must be able to read the training it
--    shows (duration, effort, type). Only sessions attached to a post are exposed.
--    This only adds a read rule; it doesn't switch row level security on or
--    off, so the owner's existing access is unchanged.
drop policy if exists "Training sessions shown in posts are readable" on public.training_sessions;
create policy "Training sessions shown in posts are readable"
  on public.training_sessions
  for select
  to authenticated
  using (
    exists (
      select 1 from public.posts p
      where p.training_session_id = training_sessions.id
    )
  );

-- 4. Refresh the API schema cache so the app sees the new column right away.
notify pgrst, 'reload schema';
