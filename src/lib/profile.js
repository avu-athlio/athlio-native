import { uploadAvatar } from '@/lib/onboarding';
import { supabase } from '@/lib/supabase';

// Profile page queries (port of pages/ProfileMe, ProfileOther, ProfileFollowing
// and the profile tabs). Columns follow the live database, which differs from
// the web repo's schema.sql: `verified` (not is_verified), and experiences
// point at a club instead of having org_name / team_name / logo_url.

export const PROFILE_SELECT = '*, club:club_id (id, name, logo_url, country, league)';

export async function fetchProfile(id) {
  const { data, error } = await supabase.from('profiles').select(PROFILE_SELECT).eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchIsFollowing(viewerId, profileId) {
  const { data, error } = await supabase
    .from('follows')
    .select('following_id, is_watchlisted')
    .eq('follower_id', viewerId)
    .eq('following_id', profileId)
    .maybeSingle();
  if (error) throw error;
  return { following: !!data, watchlisted: !!data?.is_watchlisted };
}

// Latest `info` row (athletes): nationality, body, foot, style, shirt number.
export async function fetchInfo(profileId) {
  const { data, error } = await supabase
    .from('info')
    .select(
      'nationality, nationality_code, birth_date, height_cm, weight_kg, shirt_number, preferred_foot, injured, playing_style',
    )
    .eq('profile_id', profileId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchExperiences(profileId) {
  const { data, error } = await supabase
    .from('experiences')
    .select('id, start_date, end_date, is_current, matches_played, goals_scored, club:club_id (id, name, logo_url, league)')
    .eq('profile_id', profileId)
    .order('start_date', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchMatches(playerId) {
  const { data, error } = await supabase
    .from('matches')
    .select(
      `id, date_of_game, league, your_team, opponent, your_score, opponent_score,
       goals, assists, minutes_played, yellow_cards, red_cards,
       opponent_club:opponent_club_id ( logo_url )`,
    )
    .eq('player_id', playerId)
    .order('date_of_game', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// People I follow, with their club, newest follow first.
export async function fetchFollowingProfiles(userId) {
  const { data: rows, error } = await supabase
    .from('follows')
    .select('following_id, created_at')
    .eq('follower_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  const ids = (rows ?? []).map((r) => r.following_id);
  if (!ids.length) return [];

  const { data, error: profilesErr } = await supabase
    .from('profiles')
    .select('id, full_name, username, avatar_url, position, role, verified, club:club_id (name, logo_url, country)')
    .in('id', ids);
  if (profilesErr) throw profilesErr;
  const byId = new Map((data ?? []).map((p) => [p.id, p]));
  return ids.map((id) => byId.get(id)).filter(Boolean);
}

export async function isUsernameTaken(username, uid) {
  const { data, error } = await supabase.from('profiles').select('id').ilike('username', username).limit(1);
  if (error) throw error;
  return !!data?.length && data[0].id !== uid;
}

/**
 * Updates my profile row; uploads `avatar` ({ uri, mimeType }) first if given.
 * The avatar path is fixed per user, so the URL gets a version param —
 * otherwise image caches keep showing the old picture.
 */
export async function saveProfile(uid, patch, avatar) {
  const next = { ...patch };
  if (avatar?.uri) {
    const url = await uploadAvatar(uid, avatar);
    if (!url) throw new Error('Could not upload the photo. Try again.');
    next.avatar_url = `${url}?v=${Date.now()}`;
  }
  const { data, error } = await supabase.from('profiles').update(next).eq('id', uid).select('*').single();
  if (error) throw error;
  return data;
}

// ── Info tab editing ─────────────────────────────────────────────────────

/** Updates my season-less `info` row (creating it the first time). */
export async function saveInfo(uid, patch) {
  const { data: existing, error } = await supabase
    .from('info')
    .select('id')
    .eq('profile_id', uid)
    .is('season_id', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  const row = { ...patch, updated_at: new Date().toISOString() };
  const { error: saveErr } = existing
    ? await supabase.from('info').update(row).eq('id', existing.id)
    : await supabase.from('info').insert({ profile_id: uid, ...row });
  if (saveErr) throw saveErr;
}

export async function fetchExperience(id) {
  const { data, error } = await supabase
    .from('experiences')
    .select('id, start_date, end_date, is_current, matches_played, goals_scored, club:club_id (id, name, logo_url, league)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveExperience(uid, e) {
  const row = {
    club_id: e.club.id,
    start_date: e.start_date,
    end_date: e.is_current ? null : e.end_date || null,
    is_current: e.is_current,
    matches_played: e.matches_played ?? 0,
    goals_scored: e.goals_scored ?? 0,
  };
  const { error } = e.id
    ? await supabase.from('experiences').update(row).eq('id', e.id).eq('profile_id', uid)
    : await supabase.from('experiences').insert({ profile_id: uid, ...row });
  if (error) throw error;
}

export async function deleteExperience(uid, id) {
  const { error } = await supabase.from('experiences').delete().eq('id', id).eq('profile_id', uid);
  if (error) throw error;
}

// National teams (supabase/migrations/20261118_profile_history.sql).
export const nationalMissing = (e) => ['PGRST205', '42P01'].includes(e?.code);
const NATIONAL_FIELDS = 'id, country_code, team_name, start_date, end_date, is_current, matches_played, goals_scored';

export async function fetchNationalTeams(profileId) {
  const { data, error } = await supabase
    .from('national_team_history')
    .select(NATIONAL_FIELDS)
    .eq('profile_id', profileId)
    .order('start_date', { ascending: false });
  if (error) {
    if (nationalMissing(error)) return [];
    throw error;
  }
  return data ?? [];
}

export async function fetchNationalTeam(id) {
  const { data, error } = await supabase.from('national_team_history').select(NATIONAL_FIELDS).eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveNationalTeam(uid, n) {
  const row = {
    country_code: n.country_code,
    team_name: n.team_name.trim(),
    start_date: n.start_date,
    end_date: n.is_current ? null : n.end_date || null,
    is_current: n.is_current,
    matches_played: n.matches_played ?? 0,
    goals_scored: n.goals_scored ?? 0,
  };
  const { error } = n.id
    ? await supabase.from('national_team_history').update(row).eq('id', n.id).eq('profile_id', uid)
    : await supabase.from('national_team_history').insert({ profile_id: uid, ...row });
  if (error) throw error;
}

export async function deleteNationalTeam(uid, id) {
  const { error } = await supabase.from('national_team_history').delete().eq('id', id).eq('profile_id', uid);
  if (error) throw error;
}
