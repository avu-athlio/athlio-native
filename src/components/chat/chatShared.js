import { useEffect, useState } from 'react';

import { signedUrls } from '@/lib/chat';

// Figma chat background themes (chat settings → Themes).
export const THEMES = [
  { id: 'default', label: 'Default', thumb: null, background: require('@/assets/images/chat/default.png'), pattern: true },
  { id: 'football', label: 'Football', thumb: require('@/assets/images/chat/football-thumb.png'), background: require('@/assets/images/chat/football.png') },
  { id: 'basketball', label: 'Basketball', thumb: require('@/assets/images/chat/basketball-thumb.png'), background: require('@/assets/images/chat/basketball.png') },
  { id: 'hockey', label: 'Hockey', thumb: require('@/assets/images/chat/hockey-thumb.png'), background: require('@/assets/images/chat/hockey.png') },
  { id: 'baseball', label: 'Baseball', thumb: require('@/assets/images/chat/baseball-thumb.png'), background: require('@/assets/images/chat/baseball.png') },
];
export const themeById = (id) => THEMES.find((t) => t.id === id) ?? THEMES[0];

// Chat colours from the Figma file.
export const CHAT = {
  mine: '#2631a0',
  mineText: '#fbfbfb',
  theirs: '#cdd1fe',
  theirsText: '#000215',
  time: '#a5a7bb',
  meta: '#727481',
  surface: '#fbfbfb',
  chip: '#f0f0f3',
  chipBorder: '#dfe0e7',
};

const pad2 = (n) => String(n).padStart(2, '0');
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "21.30" under a bubble (as in the design).
export const clockTime = (iso) => {
  const d = new Date(iso);
  return `${pad2(d.getHours())}.${pad2(d.getMinutes())}`;
};

// "23 Nov 2025" day separator.
export const dayLabel = (iso) => {
  const d = new Date(iso);
  return `${pad2(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};
export const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();

// Inbox: "40 mins ago", "2h ago", "3d ago", then "12 Nov".
export function timeAgo(iso, now = Date.now()) {
  const mins = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export const firstName = (p) => (p?.full_name || p?.username || '').trim().split(/\s+/)[0] || 'Them';

// Private chat photos → URLs. `paths` must be a stable array (memoize it).
export function useSignedUrls(paths) {
  const key = paths.join('|');
  const [state, setState] = useState({ key: '', urls: [] });
  useEffect(() => {
    if (!key) return undefined;
    let cancelled = false;
    signedUrls(key.split('|'))
      .then((urls) => !cancelled && setState({ key, urls }))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [key]);
  return state.key === key ? state.urls : [];
}
