import { supabase } from '@/lib/supabase';

// Home feed queries (port of components/domain/Feed.jsx).
// Unlike the web, the feed fetches follow / like state once for the whole page
// and hands it down — posts never query per item.

export const FEED_PAGE_SIZE = 20;

const POST_FIELDS = `
  id,
  type,
  content,
  media,
  media_urls,
  created_at,
  likes_count,
  comments_count,
  author_id,
  match:match_id (
    id, your_team, opponent, your_score, opponent_score,
    league, date_of_game, goals, assists, minutes_played,
    yellow_cards, red_cards,
    opponent_club:opponent_club_id ( logo_url )
  ),
  profiles:author_id (
    id,
    full_name,
    username,
    role,
    position,
    avatar_url,
    club_id,
    club:club_id (id, name, logo_url)
  )
`;

// Training posts need posts.training_session_id (supabase/migrations/
// 20261118_posts_training.sql). Until that's run, the join makes PostgREST
// reject the whole query, so we drop it and remember not to ask again.
const TRAINING_JOIN = `,
  training:training_session_id (
    id, type, session_date, duration_minutes, rating, notes
  )
`;
let trainingJoinAvailable = true;
const isMissingRelation = (e) => ['PGRST200', '42703', 'PGRST100'].includes(e?.code);

export const COMMENT_SELECT = `
  id,
  content,
  created_at,
  author_id,
  profiles:author_id (
    id,
    full_name,
    username,
    avatar_url,
    position
  )
`;

export async function fetchFollowingIds(userId) {
  const { data, error } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId);
  if (error) throw error;
  return (data ?? []).map((r) => r.following_id);
}

// Newest first. Pass `before` (created_at of the last loaded post) for the next page.
export async function fetchFeedPage(authorIds, before = null) {
  const run = (withTraining) => {
    let query = supabase
      .from('posts')
      .select(withTraining ? POST_FIELDS + TRAINING_JOIN : POST_FIELDS)
      .in('author_id', authorIds)
      .order('created_at', { ascending: false })
      .limit(FEED_PAGE_SIZE);
    if (before) query = query.lt('created_at', before);
    return query;
  };

  let { data, error } = await run(trainingJoinAvailable);
  if (error && trainingJoinAvailable && isMissingRelation(error)) {
    trainingJoinAvailable = false;
    ({ data, error } = await run(false));
  }
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

// One post (post page). Same columns and training-join fallback as the feed.
export async function fetchPost(id) {
  const run = (withTraining) =>
    supabase
      .from('posts')
      .select(withTraining ? POST_FIELDS + TRAINING_JOIN : POST_FIELDS)
      .eq('id', id)
      .maybeSingle();
  let { data, error } = await run(trainingJoinAvailable);
  if (error && trainingJoinAvailable && isMissingRelation(error)) {
    trainingJoinAvailable = false;
    ({ data, error } = await run(false));
  }
  if (error) throw error;
  return data;
}

export async function fetchLikedPostIds(userId, postIds) {
  if (!postIds.length) return [];
  const { data, error } = await supabase
    .from('post_likes')
    .select('post_id')
    .in('post_id', postIds)
    .eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map((r) => r.post_id);
}

// Profiles the user doesn't follow yet (and isn't), that finished onboarding.
export async function fetchSuggestedProfiles(excludeIds, limit = 10) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, username, position, avatar_url, club:club_id (name, logo_url)')
    .not('id', 'in', `(${excludeIds.join(',')})`)
    .not('username', 'is', null)
    .limit(limit);
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

// Comment likes need the comment_likes table (supabase/migrations/
// 20261118_comment_likes.sql). Until it exists the embed is dropped and
// comments load as before, without likes.
const COMMENT_LIKES_JOIN = `,
  likes:comment_likes ( user_id )
`;
let commentLikesAvailable = true;
export const commentLikesEnabled = () => commentLikesAvailable;

// Adds `likers` (user ids) to each comment.
const withLikers = (c) => ({ ...c, likers: (c.likes ?? []).map((l) => l.user_id) });

export async function fetchComments(postId) {
  const run = (withLikes) =>
    supabase
      .from('post_comments')
      .select(withLikes ? COMMENT_SELECT + COMMENT_LIKES_JOIN : COMMENT_SELECT)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
  let { data, error } = await run(commentLikesAvailable);
  if (error && commentLikesAvailable && isMissingRelation(error)) {
    commentLikesAvailable = false;
    ({ data, error } = await run(false));
  }
  if (error) throw error;
  return (Array.isArray(data) ? data : []).map(withLikers);
}

export async function addComment({ postId, postAuthorId, userId, content }) {
  const { data, error } = await supabase
    .from('post_comments')
    .insert({ post_id: postId, author_id: userId, content })
    .select(COMMENT_SELECT)
    .single();
  if (error) throw error;
  data.likers = [];

  if (postAuthorId && postAuthorId !== userId) {
    const { error: notifErr } = await supabase.from('notifications').insert({
      recipient_id: postAuthorId,
      user_id: postAuthorId, // legacy recipient column, still NOT NULL in the live DB
      read: false,
      actor_id: userId,
      post_id: postId,
      comment_id: data.id,
      type: 'comment',
    });
    if (notifErr) console.warn('comment notification', notifErr.message);
  }
  return data;
}

// Like notifications, same rows the web wrote.
export async function notifyLike({ postId, postAuthorId, userId }) {
  if (!postAuthorId || postAuthorId === userId) return;
  const { error } = await supabase.from('notifications').insert({
    recipient_id: postAuthorId,
    user_id: postAuthorId, // legacy recipient column, still NOT NULL in the live DB
    read: false,
    actor_id: userId,
    post_id: postId,
    type: 'like',
  });
  if (error) console.warn('like notification', error.message);
}

export async function clearLikeNotification({ postId, userId }) {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('type', 'like')
    .eq('post_id', postId)
    .eq('actor_id', userId);
  if (error) console.warn('clear like notification', error.message);
}
