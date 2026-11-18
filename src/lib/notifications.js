import { supabase } from '@/lib/supabase';

// notifications (live DB): id, recipient_id, actor_id, post_id, comment_id,
// type ('like' | 'comment' | 'comment_like' | 'follow'), read_at, created_at — plus the legacy
// user_id (= recipient, NOT NULL) and read (boolean) that inserts must fill. Written by
// lib/feed.js (like, comment), lib/commentLikes.js and lib/follows.js.

const SELECT = `
  id, type, created_at, read_at,
  actor:actor_id ( id, full_name, username, avatar_url, verified ),
  post:post_id ( id, type, media, media_urls ),
  comment:comment_id ( id, content )
`;

export async function fetchNotifications(uid, limit = 150) {
  const { data, error } = await supabase
    .from('notifications')
    .select(SELECT)
    .eq('recipient_id', uid)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function markAllRead(uid) {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString(), read: true }) // `read`: legacy flag kept in step
    .eq('recipient_id', uid)
    .is('read_at', null);
  if (error) console.warn('mark notifications read', error.message);
}

export async function fetchUnreadCount(uid) {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_id', uid)
    .is('read_at', null);
  if (error) throw error;
  return count ?? 0;
}

const SECTIONS = ['Today', 'Yesterday', 'Last week', 'Earlier'];

function sectionFor(createdAt, todayStart) {
  const d = new Date(createdAt);
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const days = Math.round((todayStart - day) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return 'Last week';
  return 'Earlier';
}

const thumbOf = (post) => post?.media_urls?.[0] || post?.media || null;

/**
 * Rows → [{ title, items }]. Within a section, likes on the same post become
 * one item with every person who liked it (newest first); new followers in a
 * section become one item too; comments stay one item each.
 * Likes on one comment merge the same way.
 * Item: { key, kind: 'like' | 'comment' | 'comment_like' | 'follow', actors, postId, thumb,
 * comment, unread, createdAt }.
 */
export function groupNotifications(rows, now = new Date()) {
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sections = new Map(SECTIONS.map((s) => [s, []]));
  const likeItems = new Map(); // `${section}:${postId}` → item
  const followItems = new Map(); // section → item

  for (const n of rows) {
    if (!n.actor) continue; // actor deleted their account
    const section = sectionFor(n.created_at, todayStart);
    const unread = !n.read_at;

    if (n.type === 'like' && n.post?.id) {
      const k = `${section}:${n.post.id}`;
      const existing = likeItems.get(k);
      if (existing) {
        if (!existing.actors.some((a) => a.id === n.actor.id)) existing.actors.push(n.actor);
        existing.unread = existing.unread || unread;
        continue;
      }
      const item = {
        key: `like-${k}`,
        kind: 'like',
        actors: [n.actor],
        postId: n.post.id,
        thumb: thumbOf(n.post),
        unread,
        createdAt: n.created_at,
      };
      likeItems.set(k, item);
      sections.get(section).push(item);
    } else if (n.type === 'comment_like' && n.comment?.id) {
      const k = `${section}:c:${n.comment.id}`;
      const existing = likeItems.get(k);
      if (existing) {
        if (!existing.actors.some((a) => a.id === n.actor.id)) existing.actors.push(n.actor);
        existing.unread = existing.unread || unread;
        continue;
      }
      const item = {
        key: `clike-${k}`,
        kind: 'comment_like',
        actors: [n.actor],
        postId: n.post?.id ?? null,
        thumb: thumbOf(n.post),
        comment: n.comment.content ?? '',
        unread,
        createdAt: n.created_at,
      };
      likeItems.set(k, item);
      sections.get(section).push(item);
    } else if (n.type === 'follow') {
      const existing = followItems.get(section);
      if (existing) {
        if (!existing.actors.some((a) => a.id === n.actor.id)) existing.actors.push(n.actor);
        existing.unread = existing.unread || unread;
        continue;
      }
      const item = {
        key: `follow-${section}`,
        kind: 'follow',
        actors: [n.actor],
        postId: null,
        thumb: null,
        unread,
        createdAt: n.created_at,
      };
      followItems.set(section, item);
      sections.get(section).push(item);
    } else if (n.type === 'comment') {
      sections.get(section).push({
        key: n.id,
        kind: 'comment',
        actors: [n.actor],
        postId: n.post?.id ?? null,
        thumb: thumbOf(n.post),
        comment: n.comment?.content ?? '',
        unread,
        createdAt: n.created_at,
      });
    }
  }

  return SECTIONS.map((title) => ({ title, items: sections.get(title) })).filter((s) => s.items.length);
}
