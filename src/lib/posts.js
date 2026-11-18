import { supabase } from '@/lib/supabase';

// Composer writes (ports of Composer.jsx, PostAboutMatchComposer.jsx, AddMatch.jsx).
// Unlike the web, images upload when you tap Share — not on pick — so photos
// you remove before posting never end up in storage.

const BUCKET = 'post-media';

export const MATCH_SELECT = `
  id, your_team, opponent, your_score, opponent_score,
  league, date_of_game, goals, assists, minutes_played,
  yellow_cards, red_cards,
  opponent_club:opponent_club_id ( logo_url )
`;

const extFrom = (mimeType) => mimeType?.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';

// images: [{ uri, mimeType }] (local files) → public URLs, in order.
export async function uploadPostImages(uid, images) {
  return Promise.all(
    images.map(async (img, i) => {
      const contentType = img.mimeType || 'image/jpeg';
      const path = `posts/${uid}/${Date.now()}_${i}.${extFrom(contentType)}`;
      const body = await fetch(img.uri).then((r) => r.arrayBuffer());
      const { error } = await supabase.storage.from(BUCKET).upload(path, body, {
        cacheControl: '3600',
        upsert: false,
        contentType,
      });
      if (error) throw new Error('Could not upload a photo. Try again.');
      return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    }),
  );
}

// type: 'basic' | 'match'. Uploads `images` first.
export async function createPost({ uid, type = 'basic', content, images = [], matchId = null }) {
  const urls = images.length ? await uploadPostImages(uid, images) : [];
  const { error } = await supabase.from('posts').insert({
    author_id: uid,
    type,
    content: content?.trim() || null,
    media: urls[0] ?? null,
    media_urls: urls,
    match_id: matchId,
  });
  if (error) throw error;
}

export async function fetchMatch(id) {
  const { data, error } = await supabase.from('matches').select(MATCH_SELECT).eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchMyMatches(uid) {
  const { data, error } = await supabase
    .from('matches')
    .select(MATCH_SELECT)
    .eq('player_id', uid)
    .order('date_of_game', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// Returns the new match id.
export async function createMatch(uid, m) {
  const { data, error } = await supabase
    .from('matches')
    .insert({
      player_id: uid,
      league: m.league,
      date_of_game: m.date,
      your_team: m.yourTeam?.name || null,
      opponent: m.opponent?.name || null,
      opponent_club_id: m.opponent?.id || null,
      your_score: m.yourScore,
      opponent_score: m.opponentScore,
      minutes_played: m.minutes,
      goals: m.goals,
      assists: m.assists,
      yellow_cards: m.cards === 'yellow' ? 1 : 0,
      red_cards: m.cards === 'red' ? 1 : 0,
      home_or_away: m.homeOrAway,
      participation: m.participation,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

// Club picker: name search (2+ chars), otherwise clubs from my country.
// The web selected no `league` but showed it on every row, so it never appeared.
export async function searchClubs(query, country) {
  let q = supabase.from('clubs').select('id, name, logo_url, country, league');
  const term = query.trim();
  if (term.length >= 2) q = q.ilike('name', `%${term}%`);
  else if (country) q = q.eq('country', country);
  const { data, error } = await q.order('name').limit(20);
  if (error) throw error;
  return data ?? [];
}

export async function fetchClub(id) {
  const { data } = await supabase.from('clubs').select('id, name, logo_url, country, league').eq('id', id).maybeSingle();
  return data;
}
