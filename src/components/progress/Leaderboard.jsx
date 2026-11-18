import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { CARD_SHADOW, MUTED, ShieldBadge } from '@/components/progress/ProgressUI';
import { colors, fonts } from '@/theme';

/**
 * Figma leaderboard table: player, A, G and a navy shield. There is no
 * player rating in the database, so the shield shows the player's rank
 * (by goals + assists) and the column is called "Rank".
 */
export default function Leaderboard({ rows, loading, error, onPressPlayer }) {
  return (
    <View style={styles.card}>
      <View style={[styles.row, styles.head]}>
        <Text style={[styles.headText, styles.player]}>Player</Text>
        <Text style={[styles.headText, styles.col]}>A</Text>
        <Text style={[styles.headText, styles.col]}>G</Text>
        <Text style={[styles.headText, styles.rank]}>Rank</Text>
      </View>
      {loading ? (
        <ActivityIndicator style={styles.state} color={colors.primary.default} />
      ) : error || !rows.length ? (
        <Text style={[styles.state, styles.stateText]}>
          {error ? 'Couldn’t load the leaderboard.' : 'No players with matches this season yet.'}
        </Text>
      ) : (
        rows.map((p, i) => {
          const none = p.isMe && !p.matches;
          return (
            <Pressable
              key={p.id}
              accessibilityRole="button"
              accessibilityLabel={`${p.isMe ? 'You' : p.full_name}, rank ${p.rank}, ${p.assists} assists, ${p.goals} goals`}
              onPress={() => onPressPlayer(p)}
              style={({ pressed }) => [styles.row, styles.player59, i < rows.length - 1 && styles.border, pressed && styles.pressed]}>
              <View style={[styles.player, styles.who]}>
                {p.avatar_url ? (
                  <Image source={{ uri: p.avatar_url }} style={[styles.avatar, p.isMe && styles.avatarMe]} contentFit="cover" />
                ) : (
                  <View style={[styles.avatar, styles.avatarEmpty, p.isMe && styles.avatarMe]} />
                )}
                <View style={styles.names}>
                  <Text style={styles.name} numberOfLines={1}>
                    {p.full_name || p.username || 'Player'}
                  </Text>
                  {p.club?.name ? (
                    <Text style={styles.club} numberOfLines={1}>
                      {p.club.name}
                    </Text>
                  ) : null}
                </View>
              </View>
              <Text style={[styles.value, styles.col, p.isMe && styles.valueMe]}>{none ? '–' : p.assists}</Text>
              <Text style={[styles.value, styles.col, p.isMe && styles.valueMe]}>{none ? '–' : p.goals}</Text>
              <View style={styles.rank}>
                <ShieldBadge value={p.rank} big={p.isMe} />
              </View>
            </Pressable>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 12, backgroundColor: colors.white, overflow: 'hidden', ...CARD_SHADOW },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 },
  head: { borderBottomWidth: 1, borderBottomColor: colors.neutral[200] },
  headText: { fontFamily: fonts.semibold, fontSize: 14, color: MUTED, textTransform: 'uppercase' },
  player: { flex: 1 },
  col: { width: 30, textAlign: 'center' },
  rank: { width: 60, alignItems: 'center', textAlign: 'center' },
  player59: { minHeight: 59 },
  border: { borderBottomWidth: 1, borderBottomColor: colors.neutral[200] },
  pressed: { backgroundColor: colors.neutral.bg },
  who: { flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  avatarEmpty: { backgroundColor: colors.neutral[100] },
  avatarMe: { borderWidth: 2, borderColor: colors.primary.default },
  names: { flexShrink: 1, gap: 3 },
  name: { fontFamily: fonts.semibold, fontSize: 14, color: colors.black },
  club: { fontFamily: fonts.medium, fontSize: 12, color: MUTED },
  value: { fontFamily: fonts.boldItalic, fontSize: 16, color: colors.black },
  valueMe: { fontSize: 18, color: colors.primary.default },
  state: { paddingVertical: 24 },
  stateText: { textAlign: 'center', fontFamily: fonts.medium, fontSize: 14, color: MUTED },
});
