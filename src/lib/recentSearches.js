import 'expo-sqlite/localStorage/install';

import { isProfessional } from '@/utils/roles';

// Profiles opened from Search, newest first, kept on this device per user.
// (No table for this in the database; the web showed suggestions instead.)
const MAX = 10;
const key = (uid) => `recentSearches:${uid}`;

export function getRecentSearches(uid, kind = 'all') {
  if (!uid) return [];
  let list = [];
  try {
    list = JSON.parse(localStorage.getItem(key(uid)) || '[]');
  } catch {
    list = [];
  }
  if (kind === 'athletes') return list.filter((p) => !isProfessional(p.role));
  if (kind === 'professionals') return list.filter((p) => isProfessional(p.role));
  return list;
}

export function addRecentSearch(uid, p) {
  if (!uid || !p?.id) return;
  const entry = {
    id: p.id,
    full_name: p.full_name,
    username: p.username,
    avatar_url: p.avatar_url,
    role: p.role,
    position: p.position,
    verified: p.verified,
    club: p.club ? { name: p.club.name, logo_url: p.club.logo_url, country: p.club.country, league: p.club.league } : null,
  };
  const list = getRecentSearches(uid).filter((x) => x.id !== p.id);
  localStorage.setItem(key(uid), JSON.stringify([entry, ...list].slice(0, MAX)));
}
