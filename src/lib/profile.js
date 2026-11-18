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
    .select('id, start_date, end_date, is_current, matches_played, goals_scored, club:club_id (name, logo_url, league)')
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
