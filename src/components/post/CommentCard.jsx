import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatTime } from '@/lib/format';
import { colors, fonts } from '@/theme';

export default function CommentCard({ comment, onOpenProfile }) {
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
      </View>
    </View>
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
});
