import { supabase } from "./supabase";

async function getUid() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Not authenticated");
  return data.user.id;
}

export async function isFollowing(authorId) {
  const uid = await getUid();
  const { data, error } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", uid)
    .eq("following_id", authorId)
    .limit(1)
    .maybeSingle();

  if (error && error.code !== "PGRST116") throw error; // ignore no rows
  return !!data;
}

export async function follow(authorId) {
  const uid = await getUid();
  const { error } = await supabase
    .from("follows")
    .insert([{ follower_id: uid, following_id: authorId }]);
  // ignore duplicate follows due to PK
  if (error && error.code !== "23505") throw error;
  // Only a new follow notifies (a duplicate means they were already told).
  if (!error) await notifyFollow(uid, authorId);
}

// "X started following you". Same table and rules as like/comment
// notifications; a failure here never undoes the follow.
async function notifyFollow(uid, followedId) {
  if (followedId === uid) return;
  const { error } = await supabase
    .from("notifications")
    .insert({
      recipient_id: followedId,
      user_id: followedId, // legacy recipient column, still NOT NULL in the live DB
      read: false,
      actor_id: uid,
      type: "follow",
    });
  if (error) console.warn("follow notification", error.message);
}

// Unfollowing removes it, so follow/unfollow taps don't pile up notifications.
async function clearFollowNotification(uid, followedId) {
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("type", "follow")
    .eq("actor_id", uid)
    .eq("recipient_id", followedId);
  if (error) console.warn("clear follow notification", error.message);
}

export async function unfollow(authorId) {
  const uid = await getUid();
  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", uid)
    .eq("following_id", authorId);
  if (error) throw error;
  await clearFollowNotification(uid, authorId);
}
