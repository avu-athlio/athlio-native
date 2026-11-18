-- Pro upgrade (Figma "Subscription overview" → "Onboarding to pro 1–4").
-- There is NO real payment yet: start_pro() simply turns Pro on for the
-- signed-in athlete, for testing. Replace it with a store/webhook-driven
-- flow (App Store / Google Play) before charging anyone.
-- Safe to run more than once.

alter table public.profiles add column if not exists pro_plan text check (pro_plan in ('monthly', 'annual'));
alter table public.profiles add column if not exists pro_started_at timestamptz;
-- Onboarding step 1: weekdays (0 = Monday … 6 = Sunday) with trainings.
alter table public.profiles add column if not exists training_schedule jsonb not null default '{"team": [], "individual": []}'::jsonb;

-- Turn Pro on (testing only; no charge).
create or replace function public.start_pro(plan text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  if plan not in ('monthly', 'annual') then
    raise exception 'unknown plan %', plan;
  end if;
  update public.profiles
     set is_pro = true, pro_plan = plan, pro_started_at = now()
   where id = auth.uid();
end;
$$;

-- Turn Pro off again (testing only).
create or replace function public.stop_pro()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
     set is_pro = false, pro_plan = null, pro_started_at = null
   where id = auth.uid();
end;
$$;

revoke all on function public.start_pro(text) from public, anon;
revoke all on function public.stop_pro() from public, anon;
grant execute on function public.start_pro(text) to authenticated;
grant execute on function public.stop_pro() to authenticated;

notify pgrst, 'reload schema';
