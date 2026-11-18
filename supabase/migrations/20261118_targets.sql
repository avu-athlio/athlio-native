-- Progress → Targets (Figma "Targets" / "Add your target" / "Edit your target").
-- The web app kept targets in memory only; this stores them per athlete.
-- Progress is not stored: the app counts it from `matches` (goals, assists,
-- matches, minutes) and `training_sessions` (sessions, training minutes)
-- between starts_on and ends_on.
-- Safe to run more than once.

create table if not exists public.targets (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  period text not null check (period in ('season', 'month', 'week')),
  category text not null check (category in ('performance', 'training')),
  unit text not null check (unit in ('goals', 'assists', 'matches', 'minutes', 'sessions', 'training_minutes')),
  target_value integer not null check (target_value between 1 and 100000),
  starts_on date not null,
  ends_on date not null,
  created_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);

create index if not exists targets_profile_period_idx on public.targets (profile_id, period, ends_on);

alter table public.targets enable row level security;

-- Targets are private to their owner.
drop policy if exists "targets_select_own" on public.targets;
create policy "targets_select_own" on public.targets
  for select using (profile_id = auth.uid());

drop policy if exists "targets_insert_own" on public.targets;
create policy "targets_insert_own" on public.targets
  for insert with check (profile_id = auth.uid());

drop policy if exists "targets_update_own" on public.targets;
create policy "targets_update_own" on public.targets
  for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());

drop policy if exists "targets_delete_own" on public.targets;
create policy "targets_delete_own" on public.targets
  for delete using (profile_id = auth.uid());

notify pgrst, 'reload schema';
