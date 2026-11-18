import { supabase } from '@/lib/supabase';
import { positionKeysFor } from '@/utils/positions';

// Search tab queries (port of pages/ProfileSearch, plus the Figma advanced
// filters the web never wired up).

export const PRO_ROLES = ['scout', 'coach', 'agent', 'manager'];
export const AGE_RANGE = [0, 40];

export const EMPTY_FILTERS = {
  athletes: { league: null, team: null, positions: [], age: AGE_RANGE },
  professionals: { league: null, roles: [] },
  events: { place: '', from: '', to: '' },
};

// How many filters differ from the defaults for one group.
export function countFilters(group, f) {
  if (!f) return 0;
  if (group === 'athletes') {
    return (
      (f.league ? 1 : 0) +
      (f.team ? 1 : 0) +
      (f.positions.length ? 1 : 0) +
      (f.age[0] !== AGE_RANGE[0] || f.age[1] !== AGE_RANGE[1] ? 1 : 0)
    );
  }
  if (group === 'professionals') return (f.league ? 1 : 0) + (f.roles.length ? 1 : 0);
  return (f.place.trim() ? 1 : 0) + (f.from ? 1 : 0) + (f.to ? 1 : 0);
}

const CLUB_FIELDS = 'id, name, logo_url, country, league';
const PROFILE_FIELDS = 'id, full_name, username, avatar_url, role, position, verified, age, country';

// PostgREST `or` filters are comma separated, so strip characters that would break them.
const clean = (s) => s.replace(/[,()*%\\]/g, ' ').trim();

/**
 * People search. kind: "all" | "athletes" | "professionals".
 * `filters` is the matching EMPTY_FILTERS group (ignored for "all").
 */
export async function searchProfiles({ term = '', kind = 'all', filters = null, excludeId = null, limit = 30 }) {
  const league = filters?.league;
  const club = league ? `club:club_id!inner (${CLUB_FIELDS})` : `club:club_id (${CLUB_FIELDS})`;
  let q = supabase.from('profiles').select(`${PROFILE_FIELDS}, ${club}`).not('username', 'is', null);

  const t = clean(term);
  if (t) q = q.or(`full_name.ilike.%${t}%,username.ilike.%${t}%`);
  if (excludeId) q = q.neq('id', excludeId);
  if (league) q = q.eq('club.league', league);

  if (kind === 'athletes') {
    q = q.eq('role', 'athlete');
    if (filters?.team?.id) q = q.eq('club_id', filters.team.id);
    if (filters?.positions?.length) q = q.overlaps('position', filters.positions.flatMap(positionKeysFor));
    const [min, max] = filters?.age ?? AGE_RANGE;
    if (min > AGE_RANGE[0]) q = q.gte('age', min);
    if (max < AGE_RANGE[1]) q = q.lte('age', max);
  } else if (kind === 'professionals') {
    q = q.in('role', filters?.roles?.length ? filters.roles : PRO_ROLES);
  }

  const { data, error } = await q.order('full_name').limit(limit);
  if (error) throw error;
  return data ?? [];
}

// "Suggested for you": people of that kind I don't follow yet, my country first.
export async function fetchSuggestions({ kind, uid, country, limit = 10 }) {
  const { data: follows } = await supabase.from('follows').select('following_id').eq('follower_id', uid);
  const exclude = [uid, ...(follows ?? []).map((f) => f.following_id)];

  let q = supabase
    .from('profiles')
    .select(`${PROFILE_FIELDS}, club:club_id (${CLUB_FIELDS})`)
    .not('username', 'is', null)
    .not('id', 'in', `(${exclude.join(',')})`);
  q = kind === 'professionals' ? q.in('role', PRO_ROLES) : q.eq('role', 'athlete');

  const { data, error } = await q.order('created_at', { ascending: false }).limit(limit * 3);
  if (error) throw error;
  const rows = data ?? [];
  const local = rows.filter((p) => country && p.country === country);
  const rest = rows.filter((p) => !(country && p.country === country));
  return [...local, ...rest].slice(0, limit);
}

export async function findClubs(term, limit = 30) {
  const { data, error } = await supabase
    .from('clubs')
    .select(CLUB_FIELDS)
    .ilike('name', `%${clean(term)}%`)
    .order('name')
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

// "Most popular": clubs with a logo (same as the web — there's no popularity data).
export async function fetchPopularClubs(limit = 20) {
  const { data, error } = await supabase.from('clubs').select(CLUB_FIELDS).not('logo_url', 'is', null).limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function fetchClubsInCountry(country, limit = 10) {
  if (!country) return [];
  const { data, error } = await supabase.from('clubs').select(CLUB_FIELDS).eq('country', country).order('name').limit(limit);
  if (error) throw error;
  return data ?? [];
}

// Distinct leagues for the filter picker.
export async function fetchLeagues() {
  const { data, error } = await supabase.from('clubs').select('league').not('league', 'is', null).limit(1000);
  if (error) throw error;
  return [...new Set((data ?? []).map((r) => r.league).filter(Boolean))].sort();
}

const EVENT_SELECT = `
  id, title, description, image_url, location_address, starts_at, ends_at, latitude, longitude,
  attendees:event_attendees ( profile:profile_id ( id, full_name, avatar_url ) )
`;

const distanceKm = (a, b) => {
  const r = (d) => (d * Math.PI) / 180;
  const dLat = r(b.lat - a.lat);
  const dLon = r(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
};

const withAttendees = (rows) =>
  (rows ?? []).map((e) => ({ ...e, attendees: (e.attendees ?? []).map((a) => a.profile).filter(Boolean) }));

/**
 * Events. With a term or filters: every match, soonest first.
 * Browsing: upcoming events (nearest first when `here` = { lat, lon } is known);
 * if there are none, the most recent past ones with `past: true`.
 */
export async function fetchEvents({ term = '', filters = null, here = null, limit = 10 } = {}) {
  const t = clean(term);
  const f = filters ?? EMPTY_FILTERS.events;
  const filtered = t || f.place.trim() || f.from || f.to;

  const base = () => {
    let q = supabase.from('events').select(EVENT_SELECT);
    if (t) q = q.ilike('title', `%${t}%`);
    if (f.place.trim()) q = q.ilike('location_address', `%${clean(f.place)}%`);
    if (f.from) q = q.gte('starts_at', `${f.from}T00:00:00`);
    if (f.to) q = q.lte('starts_at', `${f.to}T23:59:59`);
    return q;
  };

  if (filtered) {
    const { data, error } = await base().order('starts_at').limit(limit * 3);
    if (error) throw error;
    return { events: withAttendees(data), past: false };
  }

  const now = new Date().toISOString();
  const { data, error } = await base().gte('starts_at', now).order('starts_at').limit(limit * 3);
  if (error) throw error;
  let events = withAttendees(data);
  if (here) {
    events = events
      .map((e) => ({ e, d: e.latitude != null ? distanceKm(here, { lat: e.latitude, lon: e.longitude }) : Infinity }))
      .sort((a, b) => a.d - b.d)
      .map((x) => x.e);
  }
  if (events.length) return { events: events.slice(0, limit), past: false };

  const { data: old, error: oldError } = await base().lt('starts_at', now).order('starts_at', { ascending: false }).limit(limit);
  if (oldError) throw oldError;
  return { events: withAttendees(old), past: true };
}
