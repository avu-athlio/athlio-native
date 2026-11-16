import { supabase } from '@/lib/supabase';
import { buildProfilePayload } from '@/utils/payload';

const BUCKET = 'post-media';

const extFrom = (mimeType, fallback) => mimeType?.split('/')[1]?.replace('jpeg', 'jpg') || fallback;

// Upload a local file:// URI and return its public URL (or null on failure).
async function uploadLocalFile(path, uri, contentType, { upsert = false } = {}) {
  const body = await fetch(uri).then((r) => r.arrayBuffer());
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, body, { cacheControl: '3600', upsert, contentType });
  if (error) {
    console.error('Upload failed:', path, error);
    return null;
  }
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function uploadAvatar(uid, avatar) {
  if (!avatar?.uri) return null;
  const contentType = avatar.mimeType || 'image/jpeg';
  return uploadLocalFile(`avatars/${uid}.${extFrom(contentType, 'jpg')}`, avatar.uri, contentType, {
    upsert: true,
  });
}

/** Creates the optional first highlight post. Never throws. */
export async function postHighlight(uid, { media, text, match }) {
  try {
    let mediaUrl = null;
    if (media?.uri) {
      const contentType = media.mimeType || (media.type === 'video' ? 'video/mp4' : 'image/jpeg');
      const ext = extFrom(contentType, media.type === 'video' ? 'mp4' : 'jpg');
      mediaUrl = await uploadLocalFile(`posts/${uid}/${Date.now()}_highlight.${ext}`, media.uri, contentType);
    }
    const content = text || match || '';
    if (!content && !mediaUrl) return;
    await supabase.from('posts').insert({ author_id: uid, type: 'basic', content, media: mediaUrl });
  } catch (e) {
    console.error('Failed to create highlight post:', e);
  }
}

/**
 * Same rule as the web app (lowercased name, no spaces), but the web version
 * could collide with an existing user; add a number until it's free.
 */
async function pickUsername(base, uid) {
  const clean = (base || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9._]/g, '');
  const stem = clean || 'athlete';
  for (let i = 0; i < 6; i++) {
    const candidate = i === 0 ? stem : `${stem}${Math.floor(100 + Math.random() * 9900)}`;
    const { data } = await supabase.from('profiles').select('id').ilike('username', candidate).limit(1);
    if (!data?.length || data[0].id === uid) return candidate;
  }
  return `${stem}${Date.now().toString().slice(-6)}`;
}

/**
 * Saves the wizard: avatar upload, profile row, and the season-less `info` row.
 * Returns the saved profile fields. Throws if the profile can't be saved.
 */
export async function saveOnboarding({ uid, role, form, avatar }) {
  let avatarUrl = form.avatar_url;
  if (avatar?.uri) avatarUrl = (await uploadAvatar(uid, avatar)) || undefined;

  const username = form.username || (await pickUsername(form.full_name, uid));
  const payload = buildProfilePayload({
    role,
    form: { ...form, username, avatar_url: avatarUrl },
    heightUnit: 'cm',
    weightUnit: 'kg',
  });

  const { error } = await supabase.from('profiles').upsert({ id: uid, ...payload }, { onConflict: 'id' });
  if (error) throw error;

  const info = {
    ...(form.dob && { birth_date: form.dob }),
    ...(form.preferredLeg && { preferred_foot: form.preferredLeg }),
    ...(form.playingStyle && { playing_style: form.playingStyle }),
    ...(form.club_id && { club_id: form.club_id }),
  };
  if (Object.keys(info).length > 0) {
    const { data: existing } = await supabase
      .from('info')
      .select('id')
      .eq('profile_id', uid)
      .is('season_id', null)
      .maybeSingle();
    const { error: infoErr } = existing
      ? await supabase.from('info').update(info).eq('id', existing.id)
      : await supabase.from('info').insert({ profile_id: uid, ...info });
    if (infoErr) console.error('INFO SAVE ERROR', infoErr);
  }

  return { id: uid, ...payload };
}
