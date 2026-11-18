import { supabase } from '@/lib/supabase';

// training_sessions (live DB): id, profile_id, session_date, type, status,
// duration_minutes, rating, notes, source, created_at. There are no
// activity / focus / time columns, so — like the web AddTraining — the
// duration is worked out from the start/end times and the chosen activity
// plus focus (or recovery description) are kept in `notes` as "A - B".

export const TRAINING_KINDS = ['team', 'individual', 'recovery'];

export const TRAINING_LABELS = { team: 'Team', individual: 'Individual', recovery: 'Recovery' };

// "Choose type" chips per kind (Figma). Team has none.
export const ACTIVITIES = {
  team: [],
  individual: ['Football', 'Gym', 'Run', 'Other'],
  recovery: ['Active', 'Rest', 'Treatment', 'Mental'],
};

export const FOCUS_OPTIONS = ['Technical', 'Tactical', 'Fitness', 'Strength', 'Recovery'];

const SELECT = 'id, profile_id, session_date, type, status, duration_minutes, rating, notes, created_at';
const SEP = ' - ';

// Minutes between "HH:MM" times; an end before the start means past midnight.
export function durationBetween(start, end) {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const from = sh * 60 + sm;
  const to = eh * 60 + em;
  return to > from ? to - from : to + 1440 - from;
}

function packNotes({ type, activity, focus, description }) {
  const second = type === 'recovery' ? description?.trim() : focus;
  if (type === 'team') return focus || null;
  return [activity?.trim(), second].filter(Boolean).join(SEP) || null;
}

// Row → what the cards show.
export function readTraining(row) {
  if (!row) return null;
  const notes = row.notes ?? '';
  let activity = '';
  let detail = '';
  if (row.type === 'team') detail = notes;
  else {
    const i = notes.indexOf(SEP);
    activity = i === -1 ? notes : notes.slice(0, i);
    detail = i === -1 ? '' : notes.slice(i + SEP.length);
  }
  return {
    id: row.id,
    type: row.type,
    label: TRAINING_LABELS[row.type] ?? 'Training',
    date: row.session_date,
    duration: Number(row.duration_minutes) || 0,
    effort: row.rating == null ? null : Number(row.rating),
    activity,
    focus: row.type === 'recovery' ? '' : detail,
    description: row.type === 'recovery' ? detail : '',
  };
}

// Returns the new session id.
export async function createTraining(uid, t) {
  const { data, error } = await supabase
    .from('training_sessions')
    .insert({
      profile_id: uid,
      session_date: t.date,
      type: t.type,
      status: 'logged',
      duration_minutes: durationBetween(t.start, t.end),
      rating: t.type === 'recovery' ? null : t.effort,
      notes: packNotes(t),
      source: 'manual',
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

export async function fetchMyTrainings(uid) {
  const { data, error } = await supabase
    .from('training_sessions')
    .select(SELECT)
    .eq('profile_id', uid)
    .eq('status', 'logged')
    .order('session_date', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function fetchTraining(id) {
  const { data, error } = await supabase.from('training_sessions').select(SELECT).eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}
