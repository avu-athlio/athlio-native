-- Likes on comments (+ "Liked by author" badge).
-- Run once in the Supabase SQL editor (or `supabase db push`). Safe to re-run.

create table if not exists public.comment_likes (
  comment_id uuid not null references public.post_comments(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

create index if not exists comment_likes_user_idx on public.comment_likes (user_id);

-- New table, so switching row level security on here affects nothing else.
alter table public.comment_likes enable row level security;

-- Everyone signed in can see who liked a comment (needed for counts and the
-- "Liked by author" badge); you can only add or remove your own like.
drop policy if exists comment_likes_select on public.comment_likes;
create policy comment_likes_select on public.comment_likes
  for select to authenticated using (true);

drop policy if exists comment_likes_insert on public.comment_likes;
create policy comment_likes_insert on public.comment_likes
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists comment_likes_delete on public.comment_likes;
create policy comment_likes_delete on public.comment_likes
  for delete to authenticated using (auth.uid() = user_id);

-- Refresh the API schema cache so the app sees the table right away.
notify pgrst, 'reload schema';
