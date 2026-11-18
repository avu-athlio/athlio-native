import { addDays, dateKey } from '@/lib/progress';
import { supabase } from '@/lib/supabase';

// Pro upgrade + onboarding (supabase/migrations/20261118_pro.sql).
// No real payment: start_pro() just turns Pro on, for testing.

export const PLANS = {
  monthly: { label: 'Monthly', price: '€6.99', per: 'per month' },
  annual: { label: 'Annual', price: '€4.99', per: 'per month', billed: 'Billed €39.99/year', badge: 'Save 33%' },
};

// Function or column from the Pro SQL not there yet.
export const proMissing = (e) => ['PGRST202', '42883', '42703', 'PGRST204'].includes(e?.code);

export async function startPro(plan) {
  const { error } = await supabase.rpc('start_pro', { plan });
  if (error) throw error;
}

export async function stopPro() {
  const { error } = await supabase.rpc('stop_pro');
  if (error) throw error;
}

/** How many athletes are Pro, and up to four of their photos. */
export async function fetchProPlayers() {
  const { data, count, error } = await supabase
    .from('profiles')
    .select('id, avatar_url', { count: 'exact' })
    .eq('is_pro', true)
    .not('avatar_url', 'is', null)
    .limit(4);
  if (error) throw error;
  return { count: count ?? 0, avatars: (data ?? []).map((p) => p.avatar_url) };
}

/** schedule = { team: [0..6], individual: [0..6] } with 0 = Monday. */
export async function saveTrainingSchedule(uid, schedule) {
  const { error } = await supabase.from('profiles').update({ training_schedule: schedule }).eq('id', uid);
  if (error) throw error;
}

/**
 * Puts the weekly schedule on the calendar: planned sessions for the next
 * two weeks on the picked weekdays, skipping days that already have a
 * session of that type. Returns how many were added.
 */
export async function planFromSchedule(uid, schedule) {
  const from = dateKey(addDays(new Date(), 1));
  const to = dateKey(addDays(new Date(), 14));
  const { data: existing, error } = await supabase
    .from('training_sessions')
    .select('session_date, type')
    .eq('profile_id', uid)
    .gte('session_date', from)
    .lte('session_date', to);
  if (error) throw error;
  const taken = new Set((existing ?? []).map((r) => `${r.session_date}:${r.type}`));

  const rows = [];
  for (let i = 1; i <= 14; i++) {
    const d = addDays(new Date(), i);
    const weekday = (d.getDay() + 6) % 7;
    for (const type of ['team', 'individual']) {
      const key = dateKey(d);
      if (schedule[type]?.includes(weekday) && !taken.has(`${key}:${type}`)) {
        rows.push({
          profile_id: uid,
          session_date: key,
          type,
          status: 'planned',
          duration_minutes: 0,
          source: 'schedule',
        });
      }
    }
  }
  if (!rows.length) return 0;
  const { error: insertError } = await supabase.from('training_sessions').insert(rows);
  if (insertError) throw insertError;
  return rows.length;
}
