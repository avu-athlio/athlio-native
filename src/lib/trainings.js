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
// start_time comes with supabase/migrations/20261118_planning_skills.sql.
// Until that has run, queries fall back to SELECT.
let hasStartTime = true;
const missingColumn = (e) => e?.code === '42703' || e?.code === 'PGRST204';

/** Runs `build(select)` with start_time, retrying without it on an old schema. */
export async function selectSessions(build) {
  if (hasStartTime) {
    const res = await build(`${SELECT}, start_time`);
    if (!missingColumn(res.error)) return res;
    hasStartTime = false;
  }
  return build(SELECT);
}

async function writeSession(write, row) {
  if (hasStartTime) {
    const res = await write(row);
    if (!missingColumn(res.error)) return res;
    hasStartTime = false;
  }
  const { start_time: _drop, ...rest } = row;
  return write(rest);
}

const todayKey = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};
// A session dated after today can only be planned.
export const isFutureDate = (date) => !!date && date > todayKey();
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
    status: row.status === 'planned' ? 'planned' : 'logged',
    startTime: row.start_time ? String(row.start_time).slice(0, 5) : null,
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

function sessionRow(uid, t, planned) {
  return {
    profile_id: uid,
    session_date: t.date,
    type: t.type,
    status: planned ? 'planned' : 'logged',
    duration_minutes: durationBetween(t.start, t.end),
    rating: planned || t.type === 'recovery' ? null : t.effort,
    notes: packNotes(t),
    source: 'manual',
    start_time: t.start || null,
  };
}

// Returns the new session id. Future dates are saved as planned.
export async function createTraining(uid, t) {
  const row = sessionRow(uid, t, isFutureDate(t.date));
  const { data, error } = await writeSession(
    (r) => supabase.from('training_sessions').insert(r).select('id').single(),
    row,
  );
  if (error) throw error;
  return data.id;
}

/** Saves changes to a session; a planned one on or before today becomes logged. */
export async function updateTraining(uid, id, t) {
  const row = sessionRow(uid, t, isFutureDate(t.date));
  const { error } = await writeSession(
    (r) => supabase.from('training_sessions').update(r).eq('id', id).eq('profile_id', uid),
    row,
  );
  if (error) throw error;
}

export async function deleteTraining(uid, id) {
  const { error } = await supabase.from('training_sessions').delete().eq('id', id).eq('profile_id', uid);
  if (error) throw error;
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
  const { data, error } = await selectSessions((sel) =>
    supabase.from('training_sessions').select(sel).eq('id', id).maybeSingle(),
  );
  if (error) throw error;
  return data;
}
