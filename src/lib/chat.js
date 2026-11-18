import { supabase } from '@/lib/supabase';

// Chat data (tables from supabase/migrations/20261118_chat.sql). The web chat
// was mock data, so this is new. 1:1 conversations only.

const BUCKET = 'chat-media';
const PROFILE_FIELDS = 'id, full_name, username, avatar_url, role, verified';
const MESSAGE_FIELDS = 'id, conversation_id, sender_id, body, image_paths, reply_to_id, edited_at, deleted_at, created_at';
export const PAGE = 40;

// The SQL hasn't been run yet (missing table / function).
export const chatMissing = (e) => ['PGRST205', 'PGRST202', '42P01', '42883'].includes(e?.code);

export async function openDm(otherId) {
  const { data, error } = await supabase.rpc('get_or_create_dm', { other: otherId });
  if (error) throw error;
  return data;
}

async function profilesById(ids) {
  if (!ids.length) return new Map();
  const { data, error } = await supabase.from('profiles').select(PROFILE_FIELDS).in('id', ids);
  if (error) throw error;
  return new Map((data ?? []).map((p) => [p.id, p]));
}

// Inbox rows, newest first: { id, other, lastBody, lastHasImages, lastDeleted, lastMine, lastAt, unread, muted }.
export async function fetchInbox(uid) {
  const { data, error } = await supabase.rpc('my_conversations');
  if (error) throw error;
  const rows = data ?? [];
  const people = await profilesById([...new Set(rows.map((r) => r.other_id))]);
  return rows.map((r) => ({
    id: r.conversation_id,
    other: people.get(r.other_id) ?? { id: r.other_id },
    lastBody: r.last_body,
    lastHasImages: r.last_has_images,
    lastDeleted: r.last_deleted,
    lastMine: r.last_sender_id === uid,
    lastAt: r.last_at,
    unread: r.unread_count,
    muted: r.muted,
  }));
}

// Total unread messages (Home envelope badge). Muted chats don't count.
export async function fetchUnreadMessageCount() {
  const { data, error } = await supabase.rpc('my_conversations');
  if (error) throw error;
  return (data ?? []).filter((r) => !r.muted).reduce((n, r) => n + (r.unread_count || 0), 0);
}

// Header + settings for one chat: { me, other, otherReadAt, blockedByMe, blockedMe }.
export async function fetchConversation(id, uid) {
  const { data: members, error } = await supabase
    .from('conversation_members')
    .select(`user_id, last_read_at, muted, theme, profile:user_id ( ${PROFILE_FIELDS} )`)
    .eq('conversation_id', id);
  if (error) throw error;
  const me = members.find((m) => m.user_id === uid);
  const other = members.find((m) => m.user_id !== uid);
  if (!me || !other) return null;
  const { data: blocks } = await supabase
    .from('user_blocks')
    .select('blocker_id, blocked_id')
    .or(`and(blocker_id.eq.${uid},blocked_id.eq.${other.user_id}),and(blocker_id.eq.${other.user_id},blocked_id.eq.${uid})`);
  return {
    me: { muted: me.muted, theme: me.theme || 'default', lastReadAt: me.last_read_at },
    other: other.profile ?? { id: other.user_id },
    otherReadAt: other.last_read_at,
    blockedByMe: (blocks ?? []).some((b) => b.blocker_id === uid),
    blockedMe: (blocks ?? []).some((b) => b.blocker_id === other.user_id),
  };
}

// Oldest → newest. Pass `before` (created_at of the oldest loaded) for older pages.
export async function fetchMessages(conversationId, before = null) {
  let q = supabase
    .from('messages')
    .select(MESSAGE_FIELDS)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(PAGE);
  if (before) q = q.lt('created_at', before);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).reverse();
}

const extFrom = (mimeType) => mimeType?.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';

async function uploadChatImages(conversationId, images) {
  return Promise.all(
    images.map(async (img, i) => {
      const contentType = img.mimeType || 'image/jpeg';
      const path = `${conversationId}/${Date.now()}_${i}.${extFrom(contentType)}`;
      const body = await fetch(img.uri).then((r) => r.arrayBuffer());
      const { error } = await supabase.storage.from(BUCKET).upload(path, body, { contentType, upsert: false });
      if (error) throw new Error('Could not upload a photo. Try again.');
      return path;
    }),
  );
}

export async function sendMessage({ conversationId, uid, body, images = [], replyToId = null }) {
  const paths = images.length ? await uploadChatImages(conversationId, images) : [];
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: uid,
      body: body?.trim() || null,
      image_paths: paths,
      reply_to_id: replyToId,
    })
    .select(MESSAGE_FIELDS)
    .single();
  if (error) throw error;
  return data;
}

export async function editMessage(id, body) {
  const { data, error } = await supabase
    .from('messages')
    .update({ body: body.trim(), edited_at: new Date().toISOString() })
    .eq('id', id)
    .select(MESSAGE_FIELDS)
    .single();
  if (error) throw error;
  return data;
}

// Soft delete: the bubble stays as "Message deleted" so replies still make sense.
export async function deleteMessage(id) {
  const { data, error } = await supabase
    .from('messages')
    .update({ body: null, image_paths: [], deleted_at: new Date().toISOString() })
    .eq('id', id)
    .select(MESSAGE_FIELDS)
    .single();
  if (error) throw error;
  return data;
}

export async function markRead(conversationId, uid) {
  const { error } = await supabase
    .from('conversation_members')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('user_id', uid);
  if (error) console.warn('mark chat read', error.message);
}

export async function updateMySettings(conversationId, uid, patch) {
  const { error } = await supabase
    .from('conversation_members')
    .update(patch)
    .eq('conversation_id', conversationId)
    .eq('user_id', uid);
  if (error) throw error;
}

export async function setBlocked(uid, otherId, blocked) {
  const { error } = blocked
    ? await supabase.from('user_blocks').insert({ blocker_id: uid, blocked_id: otherId })
    : await supabase.from('user_blocks').delete().eq('blocker_id', uid).eq('blocked_id', otherId);
  if (error && error.code !== '23505') throw error;
}

// Private photos → short-lived URLs (cached for the session).
const urlCache = new Map();
export async function signedUrls(paths) {
  const missing = paths.filter((p) => !urlCache.has(p));
  if (missing.length) {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(missing, 60 * 60 * 6);
    if (error) throw error;
    for (const row of data ?? []) if (row.signedUrl) urlCache.set(row.path, row.signedUrl);
  }
  return paths.map((p) => urlCache.get(p)).filter(Boolean);
}

/**
 * Live updates for one chat: new / changed messages, the other person's read
 * state, and "typing". Returns { sendTyping(), unsubscribe() }.
 */
export function subscribeToChat(conversationId, uid, { onMessage, onReadAt, onTyping }) {
  const channel = supabase
    .channel(`chat:${conversationId}`, { config: { broadcast: { self: false } } })
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
      (payload) => payload.new?.id && onMessage(payload.new),
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'conversation_members', filter: `conversation_id=eq.${conversationId}` },
      (payload) => payload.new?.user_id !== uid && onReadAt(payload.new?.last_read_at),
    )
    .on('broadcast', { event: 'typing' }, (msg) => msg.payload?.uid !== uid && onTyping())
    .subscribe();

  return {
    sendTyping: () => channel.send({ type: 'broadcast', event: 'typing', payload: { uid } }),
    unsubscribe: () => supabase.removeChannel(channel),
  };
}

// Inbox refresh whenever a message I can see arrives.
export function subscribeToInbox(onChange) {
  const channel = supabase
    .channel('inbox')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, onChange)
    .subscribe();
  return () => supabase.removeChannel(channel);
}
