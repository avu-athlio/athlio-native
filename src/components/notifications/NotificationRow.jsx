import { Image } from 'expo-image';
import { UserPlus } from 'phosphor-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuraActiveIcon } from '@/components/icons/PostIcons';
import Avatar from '@/components/ui/Avatar';
import { colors, fonts } from '@/theme';

const nameOf = (a) => a.full_name || a.username || 'Someone';

// What the row says, as [bold part, muted part].
function describe(item) {
  const names = item.actors.map(nameOf);
  if (item.kind === 'comment') return [names[0], ' commented on your post.'];
  if (item.kind === 'comment_like') {
    if (names.length >= 3) return [names[0], ` and ${names.length - 1} others liked your comment.`];
    return [names.join(', '), ' liked your comment.'];
  }
  if (item.kind === 'follow') {
    if (names.length >= 3) return [names[0], ` and ${names.length - 1} others started following you.`];
    return [names.join(', '), ' started following you.'];
  }
  if (names.length >= 3) return ['Aura boost!', ` ${names.length} people reacted to your post.`];
  return [names.join(', '), ' just boosted your aura.'];
}

// Small blue badge on the avatar(s): aura for likes, person-plus for follows.
function KindBadge({ kind, style }) {
  return (
    <View style={[styles.aura, style]}>
      {kind === 'follow' ? (
        <UserPlus size={9} weight="bold" color={colors.white} />
      ) : (
        <AuraActiveIcon size={10} color={colors.white} />
      )}
    </View>
  );
}

function Faces({ item }) {
  const [a, b, c] = item.actors;
  const badged = item.kind !== 'comment';

  if (item.actors.length >= 3) {
    // Three small faces in a cluster (Figma "Aura boost!").
    return (
      <View style={styles.cluster}>
        <View style={[styles.mini, { left: 0, top: 6 }]}>
          <Avatar uri={a.avatar_url} size="mini" />
        </View>
        <View style={[styles.mini, { left: 16, top: 0 }]}>
          <Avatar uri={b.avatar_url} size="mini" />
        </View>
        <View style={[styles.mini, { left: 9, top: 16 }]}>
          <Avatar uri={c.avatar_url} size="mini" />
        </View>
        <KindBadge kind={item.kind} style={styles.clusterBadge} />
      </View>
    );
  }

  if (b) {
    return (
      <View style={styles.pair}>
        <Avatar uri={a.avatar_url} size="small" />
        <View style={styles.second}>
          <Avatar uri={b.avatar_url} size="small" />
        </View>
        {badged ? <KindBadge kind={item.kind} style={styles.pairBadge} /> : null}
      </View>
    );
  }

  return (
    <View>
      <Avatar uri={a.avatar_url} size="medium" verified={a.verified} />
      {badged ? <KindBadge kind={item.kind} style={styles.singleBadge} /> : null}
    </View>
  );
}

/**
 * Figma "Notifications" row: unread rows are blue with a dot. On the right:
 * the post thumbnail, or `action` (e.g. a Follow back button) when given.
 */
export default function NotificationRow({ item, onPress, action = null }) {
  const [bold, rest] = describe(item);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.unread ? 'New. ' : ''}${bold}${rest}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, item.unread && styles.unread, pressed && styles.pressed]}>
      {item.unread ? <View style={styles.dot} /> : null}
      <Faces item={item} />
      <Text style={styles.text} numberOfLines={2}>
        <Text style={styles.bold}>{bold}</Text>
        <Text style={styles.muted}>{rest}</Text>
      </Text>
      {action ?? (item.thumb ? <Image source={{ uri: item.thumb }} style={styles.thumb} contentFit="cover" /> : null)}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.white,
  },
  unread: { backgroundColor: colors.primary[100] },
  pressed: { opacity: 0.75 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary.default },
  text: { flex: 1, minWidth: 0, paddingTop: 2 },
  bold: { fontFamily: fonts.semibold, fontSize: 14, color: colors.black },
  muted: { fontFamily: fonts.medium, fontSize: 14, color: colors.neutral[600] },
  thumb: { width: 46, height: 46, borderRadius: 8, backgroundColor: colors.neutral[200] },

  aura: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.default,
    borderWidth: 1,
    borderColor: colors.white,
  },
  singleBadge: { position: 'absolute', right: -2, bottom: -2 },
  pair: { flexDirection: 'row', alignItems: 'flex-end', paddingRight: 4 },
  second: { marginLeft: -16, borderRadius: 999, borderWidth: 1, borderColor: colors.white },
  pairBadge: { position: 'absolute', right: 0, bottom: -2 },
  cluster: { width: 40, height: 38 },
  mini: { position: 'absolute', borderRadius: 999, borderWidth: 1, borderColor: colors.white },
  clusterBadge: { position: 'absolute', left: 22, top: 20 },
});
