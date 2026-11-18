-- Profile → Info tab (Figma "Others Profile - posts", Info tab).
--  1. national_team_history: the new "National team history" list.
--  2. Owner write rules for `info` and `experiences`, so athletes can fill
--     in their info and career history from Edit profile. (These only add
--     rules; they don't switch row level security on or off.)
-- Safe to run more than once.

-- 1 ─ national_team_history ─────────────────────────────────────────────
create table if not exists public.national_team_history (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  country_code text not null check (char_length(country_code) = 2),
  team_name text not null check (char_length(team_name) between 1 and 60), -- "France", "France U19"
  start_date date not null,
  end_date date,
  is_current boolean not null default false,
  matches_played integer not null default 0 check (matches_played >= 0),
  goals_scored integer not null default 0 check (goals_scored >= 0),
  created_at timestamptz not null default now(),
  check (end_date is null or end_date >= start_date)
);

create index if not exists national_team_history_profile_idx on public.national_team_history (profile_id, start_date desc);

alter table public.national_team_history enable row level security;

-- Shown on public profiles, like career history.
drop policy if exists "national_team_history_read" on public.national_team_history;
create policy "national_team_history_read" on public.national_team_history
  for select using (true);
drop policy if exists "national_team_history_insert_own" on public.national_team_history;
create policy "national_team_history_insert_own" on public.national_team_history
  for insert with check (profile_id = auth.uid());
drop policy if exists "national_team_history_update_own" on public.national_team_history;
create policy "national_team_history_update_own" on public.national_team_history
  for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());
drop policy if exists "national_team_history_delete_own" on public.national_team_history;
create policy "national_team_history_delete_own" on public.national_team_history
  for delete using (profile_id = auth.uid());

-- 2 ─ owners write their own info and experiences ───────────────────────
drop policy if exists "info_insert_own" on public.info;
create policy "info_insert_own" on public.info
  for insert with check (profile_id = auth.uid());
drop policy if exists "info_update_own" on public.info;
create policy "info_update_own" on public.info
  for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());

drop policy if exists "experiences_insert_own" on public.experiences;
create policy "experiences_insert_own" on public.experiences
  for insert with check (profile_id = auth.uid());
drop policy if exists "experiences_update_own" on public.experiences;
create policy "experiences_update_own" on public.experiences
  for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());
drop policy if exists "experiences_delete_own" on public.experiences;
create policy "experiences_delete_own" on public.experiences
  for delete using (profile_id = auth.uid());

notify pgrst, 'reload schema';
