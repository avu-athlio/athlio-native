-- Progress → planning ahead + skill ratings.
--  1. training_sessions: planned sessions (status 'planned', a start time).
--  2. planned_matches: matches scheduled before they're played (Figma
--     "Schedule match"). Kept apart from `matches`, which only holds played
--     games with stats, so profiles, stats and leaderboards stay correct.
--     Logging the result later fills match_id.
--  3. player_skills: the six "Profile of player" ratings (1–10) per season,
--     shown as the Skill trends radar (this season vs last season).
-- Safe to run more than once.

-- 1 ─ training_sessions ─────────────────────────────────────────────────
alter table public.training_sessions add column if not exists start_time time;

-- Replace any old status/type checks with ones that allow planning.
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.training_sessions'::regclass and contype = 'c'
      and (pg_get_constraintdef(oid) ilike '%status%' or pg_get_constraintdef(oid) ilike '%type%')
  loop
    execute format('alter table public.training_sessions drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.training_sessions
  add constraint training_sessions_status_check check (status in ('logged', 'planned'));
alter table public.training_sessions
  add constraint training_sessions_type_check check (type in ('team', 'individual', 'recovery', 'match'));

-- Owners manage their own sessions (re-created so update/delete exist too).
alter table public.training_sessions enable row level security;

drop policy if exists "training_sessions_owner_select" on public.training_sessions;
create policy "training_sessions_owner_select" on public.training_sessions
  for select using (profile_id = auth.uid());
drop policy if exists "training_sessions_owner_insert" on public.training_sessions;
create policy "training_sessions_owner_insert" on public.training_sessions
  for insert with check (profile_id = auth.uid());
drop policy if exists "training_sessions_owner_update" on public.training_sessions;
create policy "training_sessions_owner_update" on public.training_sessions
  for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());
drop policy if exists "training_sessions_owner_delete" on public.training_sessions;
create policy "training_sessions_owner_delete" on public.training_sessions
  for delete using (profile_id = auth.uid());

-- 2 ─ planned_matches ───────────────────────────────────────────────────
create table if not exists public.planned_matches (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  match_type text not null default 'League match',
  match_date date not null,
  home_or_away text check (home_or_away in ('home', 'away')),
  your_team text,
  your_team_id uuid references public.clubs (id) on delete set null,
  opponent text not null,
  opponent_id uuid references public.clubs (id) on delete set null,
  match_id uuid references public.matches (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists planned_matches_profile_date_idx on public.planned_matches (profile_id, match_date);

alter table public.planned_matches enable row level security;

drop policy if exists "planned_matches_select_own" on public.planned_matches;
create policy "planned_matches_select_own" on public.planned_matches
  for select using (profile_id = auth.uid());
drop policy if exists "planned_matches_insert_own" on public.planned_matches;
create policy "planned_matches_insert_own" on public.planned_matches
  for insert with check (profile_id = auth.uid());
drop policy if exists "planned_matches_update_own" on public.planned_matches;
create policy "planned_matches_update_own" on public.planned_matches
  for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());
drop policy if exists "planned_matches_delete_own" on public.planned_matches;
create policy "planned_matches_delete_own" on public.planned_matches
  for delete using (profile_id = auth.uid());

-- 3 ─ player_skills ─────────────────────────────────────────────────────
create table if not exists public.player_skills (
  profile_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  season integer not null, -- season start year: 2025 = 2025/26
  dribbling smallint not null check (dribbling between 1 and 10),
  passing smallint not null check (passing between 1 and 10),
  shot_power smallint not null check (shot_power between 1 and 10),
  ball_control smallint not null check (ball_control between 1 and 10),
  tackling smallint not null check (tackling between 1 and 10),
  anticipation smallint not null check (anticipation between 1 and 10),
  updated_at timestamptz not null default now(),
  primary key (profile_id, season)
);

alter table public.player_skills enable row level security;

drop policy if exists "player_skills_select_own" on public.player_skills;
create policy "player_skills_select_own" on public.player_skills
  for select using (profile_id = auth.uid());
drop policy if exists "player_skills_insert_own" on public.player_skills;
create policy "player_skills_insert_own" on public.player_skills
  for insert with check (profile_id = auth.uid());
drop policy if exists "player_skills_update_own" on public.player_skills;
create policy "player_skills_update_own" on public.player_skills
  for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());

notify pgrst, 'reload schema';
