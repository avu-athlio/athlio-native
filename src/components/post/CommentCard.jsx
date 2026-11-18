import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuraActiveIcon, AuraIcon } from '@/components/icons/PostIcons';
import { formatTime } from '@/lib/format';
import { colors, fonts } from '@/theme';

/**
 * One comment. With `likes` ({ count, liked, byAuthor, canLike, onToggle })
 * it shows an aura (like) button and count on the right, and a
 * "Liked by author" badge when the post's author liked it. Your own comments
 * show the count but can't be liked.
 */
export default function CommentCard({ comment, onOpenProfile, likes = null }) {
  const prof = comment.profiles || {};
  const name = prof.full_name || prof.username || 'Unknown';
  const open = () => prof.id && onOpenProfile?.(prof.id);

  return (
    <View style={styles.row}>
      <Pressable onPress={open} accessibilityRole="link" accessibilityLabel={`${name}'s profile`}>
        {prof.avatar_url ? (
          <Image source={{ uri: prof.avatar_url }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={[styles.avatar, styles.fallback]}>
            <Text style={styles.fallbackText}>{name[0]}</Text>
          </View>
        )}
      </Pressable>
      <View style={styles.main}>
        <View style={styles.meta}>
          <Text style={styles.name} onPress={open}>
            {name}
          </Text>
          <Text style={styles.time}>{formatTime(comment.created_at)}</Text>
        </View>
        <Text style={styles.text}>{comment.content}</Text>
        {likes?.byAuthor ? (
          <View style={styles.badge}>
            <AuraActiveIcon size={10} color={colors.primary[800]} />
            <Text style={styles.badgeText}>Liked by author</Text>
          </View>
        ) : null}
      </View>
      {likes ? <LikeButton {...likes} /> : null}
    </View>
  );
}

function LikeButton({ count, liked, canLike, onToggle }) {
  const content = (
    <>
      {liked ? <AuraActiveIcon size={16} color={colors.primary.default} /> : <AuraIcon size={16} color={colors.neutral[700]} />}
      <Text style={[styles.count, liked && styles.countLiked]}>{count > 0 ? count : ' '}</Text>
    </>
  );

  if (!canLike) {
    // Own comment: just the count (nothing to show if no one liked it yet).
    if (!count) return null;
    return (
      <View style={styles.like} accessible accessibilityLabel={`${count} ${count === 1 ? 'like' : 'likes'}`}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={liked ? 'Unlike comment' : 'Like comment'}
      accessibilityState={{ selected: liked }}
      accessibilityValue={{ text: `${count} ${count === 1 ? 'like' : 'likes'}` }}
      hitSlop={8}
      onPress={onToggle}
      style={({ pressed }) => [styles.like, pressed && styles.pressed]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: colors.neutral.bg,
  },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  fallback: { backgroundColor: colors.neutral[200], alignItems: 'center', justifyContent: 'center' },
  fallbackText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.black },
  main: { flex: 1 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontFamily: fonts.semibold, fontSize: 10, color: colors.black },
  time: { fontFamily: fonts.regular, fontSize: 10, color: colors.neutral[700] },
  text: { marginTop: 2, fontFamily: fonts.regular, fontSize: 12, color: colors.neutral[900] },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: colors.primary[100],
  },
  badgeText: {
    fontFamily: fonts.semiboldItalic,
    fontSize: 10,
    letterSpacing: -0.1,
    textTransform: 'uppercase',
    color: colors.primary[800],
  },
  like: { alignItems: 'center', minWidth: 28, paddingTop: 2, gap: 2 },
  pressed: { opacity: 0.6 },
  count: { fontFamily: fonts.medium, fontSize: 10, color: colors.neutral[700] },
  countLiked: { color: colors.primary.default },
});
