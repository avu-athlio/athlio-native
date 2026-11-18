import { seasonStartYear } from '@/lib/profile-format';
import { supabase } from '@/lib/supabase';
import { readTraining, selectSessions } from '@/lib/trainings';
import { positionAbbrs, positionKeysFor } from '@/utils/positions';

// Everything on the Progress tab is worked out from the athlete's own
// `matches` and `training_sessions` rows. Targets live in `targets`
// (supabase/migrations/20261118_targets.sql); their progress is counted here.

// ── Dates ────────────────────────────────────────────────────────────────

const pad = (n) => String(n).padStart(2, '0');
export const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseKey = (k) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const startOfWeek = (d) => addDays(d, -((d.getDay() + 6) % 7)); // Monday
export const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
export const endOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0);

// ── Seasons (July → June) ────────────────────────────────────────────────

export const currentSeason = () => seasonStartYear(new Date());
export const seasonTitle = (y) => `Season ${y}/${String(y + 1).slice(2)}`;
export const seasonShort = (y) => `${y}/${String(y + 1).slice(2)}`;
export const seasonRange = (y) => ({ from: `${y}-07-01`, to: `${y + 1}-06-30` });

const inRange = (key, from, to) => !!key && key >= from && key <= to;

// Seasons the athlete has matches in, plus the current one, newest first.
export function seasonsOf(matches) {
  const set = new Set([currentSeason()]);
  for (const m of matches) {
    const y = seasonStartYear(m.date_of_game);
    if (y != null) set.add(y);
  }
  return [...set].sort((a, b) => b - a);
}

function totals(rows) {
  return rows.reduce(
    (t, m) => ({
      matches: t.matches + 1,
      goals: t.goals + (Number(m.goals) || 0),
      assists: t.assists + (Number(m.assists) || 0),
      minutes: t.minutes + (Number(m.minutes_played) || 0),
    }),
    { matches: 0, goals: 0, assists: 0, minutes: 0 },
  );
}

export function seasonTotals(matches, y) {
  const { from, to } = seasonRange(y);
  return totals(matches.filter((m) => inRange(m.date_of_game, from, to)));
}

/**
 * The season card numbers, with the change vs. the season before. For the
 * season in progress the previous one is cut at the same point in the year,
 * so "3 more" means "3 more than by this date last season".
 */
export function seasonSummary(matches, y) {
  const now = totals(matches.filter((m) => inRange(m.date_of_game, seasonRange(y).from, seasonRange(y).to)));
  const prevRange = seasonRange(y - 1);
  let prevTo = prevRange.to;
  if (y === currentSeason()) {
    const t = new Date();
    prevTo = dateKey(new Date(t.getFullYear() - 1, t.getMonth(), t.getDate()));
  }
  const prev = totals(matches.filter((m) => inRange(m.date_of_game, prevRange.from, prevTo)));
  const hadPrev = matches.some((m) => inRange(m.date_of_game, prevRange.from, prevRange.to));
  const change = (k) => (hadPrev ? now[k] - prev[k] : null);
  return { ...now, change: { matches: change('matches'), goals: change('goals'), assists: change('assists') } };
}

// ── Fetching ─────────────────────────────────────────────────────────────

const MATCH_FIELDS =
  'id, date_of_game, goals, assists, minutes_played, your_team, opponent, your_score, opponent_score, league';

export async function fetchMyMatches(uid) {
  const { data, error } = await supabase
    .from('matches')
    .select(MATCH_FIELDS)
    .eq('player_id', uid)
    .order('date_of_game', { ascending: false })
    .limit(1000);
  if (error) throw error;
  return data ?? [];
}

/** Logged and planned sessions (readTraining shape, with `status`). */
export async function fetchMyTrainingLog(uid) {
  const { data, error } = await selectSessions((sel) =>
    supabase
      .from('training_sessions')
      .select(sel)
      .eq('profile_id', uid)
      .in('status', ['logged', 'planned'])
      .order('session_date', { ascending: false })
      .limit(1000),
  );
  if (error) throw error;
  return (data ?? []).map(readTraining);
}

// Tables from supabase/migrations/20261118_planning_skills.sql.
export const planningMissing = (e) => ['PGRST205', '42P01'].includes(e?.code);

const PLANNED_FIELDS =
  'id, match_type, match_date, home_or_away, your_team, your_team_id, opponent, opponent_id, match_id, created_at';

export async function fetchPlannedMatches(uid) {
  const { data, error } = await supabase
    .from('planned_matches')
    .select(PLANNED_FIELDS)
    .eq('profile_id', uid)
    .order('match_date', { ascending: true })
    .limit(500);
  if (error) throw error;
  return data ?? [];
}

export async function fetchPlannedMatch(uid, id) {
  const { data, error } = await supabase
    .from('planned_matches')
    .select(PLANNED_FIELDS)
    .eq('id', id)
    .eq('profile_id', uid)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function schedulePlannedMatch(uid, m) {
  const { error } = await supabase.from('planned_matches').insert({
    profile_id: uid,
    match_type: m.league,
    match_date: m.date,
    home_or_away: m.homeOrAway,
    your_team: m.yourTeam?.name ?? null,
    your_team_id: m.yourTeam?.id ?? null,
    opponent: m.opponent.name,
    opponent_id: m.opponent?.id ?? null,
  });
  if (error) throw error;
}

export async function deletePlannedMatch(uid, id) {
  const { error } = await supabase.from('planned_matches').delete().eq('id', id).eq('profile_id', uid);
  if (error) throw error;
}

// After the result is logged in add-match.
export async function linkPlannedMatch(uid, id, matchId) {
  const { error } = await supabase
    .from('planned_matches')
    .update({ match_id: matchId })
    .eq('id', id)
    .eq('profile_id', uid);
  if (error) throw error;
}

// ── Skills ("Profile of player") ─────────────────────────────────────────

export const SKILLS = [
  { key: 'anticipation', label: 'Anticipation' },
  { key: 'shot_power', label: 'Shot power' },
  { key: 'tackling', label: 'Tackling' },
  { key: 'ball_control', label: 'Ball control' },
  { key: 'dribbling', label: 'Dribbling' },
  { key: 'passing', label: 'Passing' },
];

/** { current, previous } skill rows for the current season and the one before (or null). */
export async function fetchSkills(uid) {
  const cur = currentSeason();
  const { data, error } = await supabase
    .from('player_skills')
    .select('season, dribbling, passing, shot_power, ball_control, tackling, anticipation')
    .eq('profile_id', uid)
    .in('season', [cur, cur - 1]);
  if (error) throw error;
  const rows = data ?? [];
  return {
    current: rows.find((r) => r.season === cur) ?? null,
    previous: rows.find((r) => r.season === cur - 1) ?? null,
  };
}

export async function saveSkills(uid, values) {
  const row = { profile_id: uid, season: currentSeason(), updated_at: new Date().toISOString() };
  for (const s of SKILLS) row[s.key] = values[s.key];
  const { error } = await supabase.from('player_skills').upsert(row, { onConflict: 'profile_id,season' });
  if (error) throw error;
}

// ── Performance analysis ─────────────────────────────────────────────────

// How far through the playing part of the season (Aug → May) we are, 0..1.
function seasonElapsed(y) {
  const start = new Date(y, 7, 1).getTime();
  const end = new Date(y + 1, 4, 31).getTime();
  return Math.min(1, Math.max(0, (Date.now() - start) / (end - start)));
}

/**
 * Chart points for one stat (goals | assists | matches): the last two
 * finished seasons as logged, then the current season and the next one as
 * predictions. The current season is projected from its pace so far; the
 * next one carries the same trend forward (capped at ±50%).
 */
export function seasonSeries(matches, stat) {
  const cur = currentSeason();
  const value = (y) => seasonTotals(matches, y)[stat];
  const done = [cur - 2, cur - 1].map((y) => ({ season: y, value: value(y), predicted: false }));

  const soFar = value(cur);
  const elapsed = seasonElapsed(cur);
  const projected = elapsed >= 0.1 ? Math.round(soFar / elapsed) : soFar;
  const last = done[1].value;
  const trend = last ? Math.max(-0.5, Math.min(0.5, (projected - last) / last)) : 0;
  const next = Math.round(projected * (1 + trend));

  return [
    ...done,
    { season: cur, value: Math.max(projected, soFar), predicted: true, soFar },
    { season: cur + 1, value: next, predicted: true },
  ];
}

export function percentChange(now, before) {
  if (!before) return null;
  return Math.round(((now - before) / before) * 100);
}

// Headline under the chart.
export function seasonVerdict(series, statLabel) {
  const [a, b, current] = series;
  if (!a.value && !b.value && !current.soFar) {
    return { good: null, title: 'Start logging your matches', text: 'Your analysis appears as you add matches.' };
  }
  const best = Math.max(a.value, b.value);
  if (current.value > best) {
    return { good: true, title: 'You’re on track to your best season yet!', text: 'Keep up the great work!' };
  }
  const gap = best - current.value;
  return {
    good: false,
    title: `${gap} more ${statLabel} to match your best season`,
    text: 'Keep logging every match to stay on top of it.',
  };
}

// Projected season totals vs. last season (the "Performance predictions" cards).
export function predictions(matches) {
  const cur = currentSeason();
  const elapsed = seasonElapsed(cur);
  const now = seasonTotals(matches, cur);
  const prev = seasonTotals(matches, cur - 1);
  const project = (v) => (elapsed >= 0.1 ? Math.round(v / elapsed) : v);
  return [
    { key: 'goals', label: 'Goals', value: project(now.goals), change: percentChange(project(now.goals), prev.goals) },
    { key: 'assists', label: 'Assists', value: project(now.assists), change: percentChange(project(now.assists), prev.assists) },
    { key: 'minutes', label: 'Minutes', value: project(now.minutes), change: percentChange(project(now.minutes), prev.minutes) },
  ];
}

const contribution = (rows) => (rows.length ? rows.reduce((s, m) => s + (+m.goals || 0) + (+m.assists || 0), 0) / rows.length : null);

/**
 * "Training impact": goal contributions (goals + assists) per match in
 * matches after a certain kind of training load, compared with the rest.
 * `value` is null when either side has no matches yet.
 */
export function trainingImpact(matches, trainings) {
  const cur = seasonRange(currentSeason());
  const games = matches.filter((m) => inRange(m.date_of_game, cur.from, cur.to));
  const weekOf = (k) => dateKey(startOfWeek(parseKey(k)));
  const perWeek = new Map();
  const gymWeeks = new Set();
  for (const t of trainings) {
    const w = weekOf(t.date);
    perWeek.set(w, (perWeek.get(w) ?? 0) + 1);
    if (/gym/i.test(t.activity)) gymWeeks.add(w);
  }
  const recoveryDays = new Set(trainings.filter((t) => t.type === 'recovery').map((t) => t.date));
  const afterRecovery = (m) => {
    const d = parseKey(m.date_of_game);
    return [1, 2].some((n) => recoveryDays.has(dateKey(addDays(d, -n))));
  };

  const compare = (test) => {
    const yes = games.filter(test);
    const no = games.filter((m) => !test(m));
    const a = contribution(yes);
    const b = contribution(no);
    if (a == null || b == null || !b) return null;
    return Math.round(((a - b) / b) * 100);
  };

  return [
    {
      key: 'load',
      label: 'Weeks with 4+ trainings',
      sub: 'goal contributions per match',
      value: compare((m) => (perWeek.get(weekOf(m.date_of_game)) ?? 0) >= 4),
    },
    {
      key: 'recovery',
      label: 'Recovery days',
      sub: 'goal contributions after recovery',
      value: compare(afterRecovery),
    },
    {
      key: 'gym',
      label: 'Gym sessions',
      sub: 'goal contributions in gym weeks',
      value: compare((m) => gymWeeks.has(weekOf(m.date_of_game))),
    },
  ];
}

// ── Trainings ────────────────────────────────────────────────────────────

/**
 * What's on each day, keyed by "YYYY-MM-DD": logged `trainings`, played
 * `matches`, `planned` sessions and `plannedMatches` (not yet logged).
 */
export function dayMap(trainings, matches, planned = [], plannedMatches = []) {
  const map = new Map();
  const get = (k) => {
    if (!map.has(k)) map.set(k, { trainings: [], matches: [], planned: [], plannedMatches: [] });
    return map.get(k);
  };
  for (const t of trainings) if (t.date) get(t.date).trainings.push(t);
  for (const m of matches) if (m.date_of_game) get(m.date_of_game).matches.push(m);
  for (const p of planned) if (p.date) get(p.date).planned.push(p);
  for (const m of plannedMatches) if (!m.match_id && m.match_date) get(m.match_date).plannedMatches.push(m);
  return map;
}

// Icon kind for a day: a match wins, then the first session's type.
export function dayKind(day) {
  if (!day) return null;
  if (day.matches.length || day.plannedMatches.length) return 'match';
  return day.trainings[0]?.type ?? day.planned[0]?.type ?? null;
}

/**
 * Dot under a day: 'planned' (blue, coming up), 'done' (green), 'missed'
 * (red: planned but never logged), or 'none'.
 */
export function dayStatus(day, key, todayKey) {
  if (!day) return 'none';
  const pending = day.planned.length + day.plannedMatches.length;
  if (pending && key >= todayKey) return 'planned';
  if (day.trainings.length || day.matches.length) return 'done';
  if (pending) return 'missed';
  return 'none';
}

export const PROGRESS_PERIODS = [
  { value: 'month', label: 'This month' },
  { value: 'week', label: 'This week' },
];

function periodBounds(period, offset = 0) {
  const t = new Date();
  if (period === 'week') {
    const s = addDays(startOfWeek(t), 7 * offset);
    return { from: dateKey(s), to: dateKey(addDays(s, 6)) };
  }
  const s = new Date(t.getFullYear(), t.getMonth() + offset, 1);
  return { from: dateKey(s), to: dateKey(endOfMonth(s)) };
}

/** "Your progress": sessions, time and average effort, this period vs. the last. */
export function trainingProgress(trainings, period) {
  const pick = (b) => trainings.filter((t) => inRange(t.date, b.from, b.to));
  const now = pick(periodBounds(period, 0));
  const before = pick(periodBounds(period, -1));
  const sum = (rows) => rows.reduce((s, t) => s + t.duration, 0);
  const avg = (rows) => {
    const rated = rows.filter((t) => t.effort != null);
    return rated.length ? rated.reduce((s, t) => s + t.effort, 0) / rated.length : null;
  };
  const effortNow = avg(now);
  const effortBefore = avg(before);
  return {
    sessions: now.length,
    sessionsChange: percentChange(now.length, before.length),
    minutes: sum(now),
    minutesChange: percentChange(sum(now), sum(before)),
    effort: effortNow,
    effortChange: effortNow != null && effortBefore ? percentChange(effortNow, effortBefore) : null,
    rows: now,
  };
}

// Breakdown rows: team training, then each individual activity, then recovery.
export function trainingBreakdown(rows) {
  const groups = new Map([['Team training', 0]]);
  for (const t of rows) {
    let label = 'Recovery';
    if (t.type === 'team') label = 'Team training';
    else if (t.type === 'individual') label = t.activity === 'Football' ? 'Football training' : t.activity || 'Individual';
    groups.set(label, (groups.get(label) ?? 0) + 1);
  }
  if (!groups.has('Recovery')) groups.set('Recovery', 0);
  const total = rows.length;
  return [...groups].map(([label, count]) => ({
    label,
    count,
    pct: total ? Math.round((count / total) * 100) : 0,
  }));
}

export function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/** Consistency tip from the last four weeks of logged trainings. */
export function consistencyTip(trainings) {
  const thisWeek = startOfWeek(new Date());
  const weeks = [3, 2, 1, 0].map((n) => {
    const s = addDays(thisWeek, -7 * n);
    const from = dateKey(s);
    const to = dateKey(addDays(s, 6));
    return trainings.filter((t) => inRange(t.date, from, to)).length;
  });
  const total = weeks.reduce((a, b) => a + b, 0);
  if (!total) {
    return { title: 'Log your first training', text: 'Your weekly rhythm shows up here once you log sessions.' };
  }
  const peak = weeks.indexOf(Math.max(...weeks));
  const last = weeks[2];
  const avg = total / 4;
  if (weeks[3] + last < avg * 2 && peak < 3) {
    return {
      title: 'Add one session next week',
      text: `You peaked in week ${peak + 1} of the last four and trained less since. Keep your consistency stable.`,
    };
  }
  return {
    title: 'Great consistency',
    text: `${total} sessions in the last four weeks. Keep the same rhythm.`,
  };
}

// ── Targets ──────────────────────────────────────────────────────────────

export const TARGET_PERIODS = [
  { value: 'season', label: 'Season' },
  { value: 'month', label: 'Month' },
  { value: 'week', label: 'Week' },
];
export const TARGET_CATEGORIES = [
  { value: 'performance', label: 'Performance' },
  { value: 'training', label: 'Training' },
];
export const TARGET_UNITS = {
  performance: [
    { value: 'goals', label: 'Goals' },
    { value: 'assists', label: 'Assists' },
    { value: 'matches', label: 'Matches' },
    { value: 'minutes', label: 'Minutes' },
  ],
  training: [
    { value: 'sessions', label: 'Sessions' },
    { value: 'training_minutes', label: 'Training minutes' },
  ],
};
// Bar / gauge colour per unit ("colour depends on the category" in Figma).
export const TARGET_COLORS = {
  goals: '#ff983d',
  assists: '#09de54',
  matches: '#4051fd',
  minutes: '#6f92ff',
  sessions: '#6f92ff',
  training_minutes: '#98baff',
};
// Free athletes get season targets only, up to this many.
export const FREE_TARGET_LIMIT = 2;

export function periodRange(period, d = new Date()) {
  if (period === 'week') {
    const s = startOfWeek(d);
    return { from: dateKey(s), to: dateKey(addDays(s, 6)) };
  }
  if (period === 'month') return { from: dateKey(startOfMonth(d)), to: dateKey(endOfMonth(d)) };
  return seasonRange(seasonStartYear(d));
}

export const targetsMissing = (e) => ['PGRST205', '42P01'].includes(e?.code);

// Targets whose period is still running.
export async function fetchTargets(uid) {
  const { data, error } = await supabase
    .from('targets')
    .select('id, name, period, category, unit, target_value, starts_on, ends_on, created_at')
    .eq('profile_id', uid)
    .gte('ends_on', dateKey(new Date()))
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchTarget(uid, id) {
  const { data, error } = await supabase
    .from('targets')
    .select('id, name, period, category, unit, target_value, starts_on, ends_on')
    .eq('id', id)
    .eq('profile_id', uid)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** A starting point for a new target: last season's average per period, plus one. */
export function suggestTarget(matches, period) {
  const last = seasonTotals(matches, currentSeason() - 1);
  const per = { season: 1, month: 10, week: 43 }[period];
  const goals = Math.round(last.goals / per);
  if (last.goals && goals >= 1) {
    return {
      title: 'Suggested target',
      text: `Last season you averaged ${goals} goal${goals === 1 ? '' : 's'} a ${period}. Aim for ${goals + 1} this ${period}.`,
    };
  }
  return {
    title: 'Suggested target',
    text: `Start with a training target, like ${period === 'week' ? 3 : period === 'month' ? 12 : 120} sessions this ${period}.`,
  };
}

export async function saveTarget(uid, t) {
  const { from, to } = periodRange(t.period);
  const row = {
    name: t.name.trim(),
    period: t.period,
    category: t.category,
    unit: t.unit,
    target_value: t.target_value,
    starts_on: from,
    ends_on: to,
  };
  const q = t.id
    ? supabase.from('targets').update(row).eq('id', t.id).eq('profile_id', uid)
    : supabase.from('targets').insert({ ...row, profile_id: uid });
  const { error } = await q;
  if (error) throw error;
}

export async function deleteTarget(uid, id) {
  const { error } = await supabase.from('targets').delete().eq('id', id).eq('profile_id', uid);
  if (error) throw error;
}

/** Adds `current`, `pct`, `met` and `daysLeft` to each target. */
export function withProgress(targets, matches, trainings) {
  const today = parseKey(dateKey(new Date()));
  return targets.map((t) => {
    const games = matches.filter((m) => inRange(m.date_of_game, t.starts_on, t.ends_on));
    const sessions = trainings.filter((s) => inRange(s.date, t.starts_on, t.ends_on));
    const g = totals(games);
    const current = {
      goals: g.goals,
      assists: g.assists,
      matches: g.matches,
      minutes: g.minutes,
      sessions: sessions.length,
      training_minutes: sessions.reduce((s, x) => s + x.duration, 0),
    }[t.unit] ?? 0;
    const pct = Math.min(100, Math.round((current / t.target_value) * 100));
    const daysLeft = Math.max(0, Math.round((parseKey(t.ends_on) - today) / 86400000));
    return { ...t, current, pct, met: current >= t.target_value, daysLeft };
  });
}

// ── Leaderboard ──────────────────────────────────────────────────────────

export const LEADERBOARD_SCOPES = [
  { value: 'world', label: 'All world' },
  { value: 'country', label: 'My country' },
];

/**
 * Players with the same position and a similar age (±2 years), ranked by
 * goals + assists in the season. Returns the top `size` rows; if the athlete
 * isn't among them, the last row is swapped for theirs (with their rank).
 */
export async function fetchLeaderboard(me, season, scope, size = 5) {
  let q = supabase
    .from('profiles')
    .select('id, full_name, username, avatar_url, age, country, position, club:club_id (name)')
    .eq('role', 'athlete')
    .limit(300);
  const positions = positionAbbrs(me.position).flatMap(positionKeysFor);
  if (positions.length) q = q.overlaps('position', positions);
  if (me.age) q = q.gte('age', me.age - 2).lte('age', me.age + 2);
  if (scope === 'country' && me.country) q = q.eq('country', me.country);
  const { data: players, error } = await q;
  if (error) throw error;

  const list = players ?? [];
  if (!list.some((p) => p.id === me.id)) list.push(me);
  const { from, to } = seasonRange(season);
  const { data: rows, error: mErr } = await supabase
    .from('matches')
    .select('player_id, goals, assists')
    .in('player_id', list.map((p) => p.id))
    .gte('date_of_game', from)
    .lte('date_of_game', to)
    .limit(5000);
  if (mErr) throw mErr;

  const stats = new Map();
  for (const r of rows ?? []) {
    const s = stats.get(r.player_id) ?? { goals: 0, assists: 0, matches: 0 };
    s.goals += Number(r.goals) || 0;
    s.assists += Number(r.assists) || 0;
    s.matches += 1;
    stats.set(r.player_id, s);
  }
  const ranked = list
    .map((p) => ({ ...p, ...(stats.get(p.id) ?? { goals: 0, assists: 0, matches: 0 }) }))
    .filter((p) => p.matches > 0 || p.id === me.id)
    .sort((a, b) => b.goals + b.assists - (a.goals + a.assists) || b.goals - a.goals)
    .map((p, i) => ({ ...p, rank: i + 1, isMe: p.id === me.id }));

  const top = ranked.slice(0, size);
  if (!top.some((p) => p.isMe)) {
    const mine = ranked.find((p) => p.isMe);
    if (mine) top.splice(size - 1, 1, mine);
  }
  return top;
}
