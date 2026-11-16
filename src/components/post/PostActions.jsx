import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuraActiveIcon, AuraIcon, CommentIcon } from '@/components/icons/PostIcons';
import { colors, fonts } from '@/theme';

// Aura (like) + comments. Stateless: the feed owns liked state and counts.
export default function PostActions({ liked, likesCount, commentsCount, onToggleLike, onOpenComments }) {
  return (
    <View style={styles.row}>
      <ActionIcon
        label={liked ? 'Remove aura' : 'Give aura'}
        selected={liked}
        count={likesCount}
        onPress={onToggleLike}>
        {liked ? <AuraActiveIcon color={colors.primary.default} /> : <AuraIcon color={colors.black} />}
      </ActionIcon>
      <ActionIcon label="Comments" count={commentsCount} onPress={onOpenComments}>
        <CommentIcon color={colors.black} />
      </ActionIcon>
    </View>
  );
}

function ActionIcon({ children, count = 0, onPress, label, selected }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${count}`}
      accessibilityState={selected !== undefined ? { selected } : undefined}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
      <View style={styles.icon}>{children}</View>
      <Text style={styles.count}>{count}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 16, alignSelf: 'stretch' },
  action: { flexDirection: 'row', alignItems: 'center' },
  icon: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  count: { fontFamily: fonts.regular, fontSize: 14, color: colors.black },
  pressed: { opacity: 0.6 },
});
