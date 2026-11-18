import { supabase } from '@/lib/supabase';

// Likes on comments (table comment_likes, see supabase/migrations/
// 20261118_comment_likes.sql). Liking someone's comment notifies them.

export async function likeComment({ commentId, userId, commentAuthorId, postId }) {
  const { error } = await supabase.from('comment_likes').insert({ comment_id: commentId, user_id: userId });
  if (error && error.code !== '23505') throw error; // 23505: already liked
  if (!error && commentAuthorId && commentAuthorId !== userId) {
    const { error: notifErr } = await supabase.from('notifications').insert({
      recipient_id: commentAuthorId,
      user_id: commentAuthorId, // legacy recipient column, still NOT NULL in the live DB
      read: false,
      actor_id: userId,
      post_id: postId,
      comment_id: commentId,
      type: 'comment_like',
    });
    if (notifErr) console.warn('comment like notification', notifErr.message);
  }
}

export async function unlikeComment({ commentId, userId }) {
  const { error } = await supabase.from('comment_likes').delete().eq('comment_id', commentId).eq('user_id', userId);
  if (error) throw error;
  const { error: notifErr } = await supabase
    .from('notifications')
    .delete()
    .eq('type', 'comment_like')
    .eq('comment_id', commentId)
    .eq('actor_id', userId);
  if (notifErr) console.warn('clear comment like notification', notifErr.message);
}
