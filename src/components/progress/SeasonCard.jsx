import { Image } from 'expo-image';
import { CaretDown, CaretRight } from 'phosphor-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Delta, ProBadge, StripedCard } from '@/components/progress/ProgressUI';
import Button from '@/components/ui/Button';
import { seasonTitle } from '@/lib/progress';
import { colors, fonts } from '@/theme';

const STATS = [
  { key: 'matches', label: 'Matches', icon: require('@/assets/images/progress/stat-matches.svg'), box: { left: 56, top: 8, width: 44.1, height: 35.9 } },
  { key: 'goals', label: 'Goals', icon: require('@/assets/images/progress/stat-goals.svg'), box: { left: 55, top: 0, width: 49, height: 49 } },
  { key: 'assists', label: 'Assists', icon: require('@/assets/images/progress/stat-assists.svg'), box: { left: 62, top: 6, width: 39.2, height: 41.7 } },
];

const deltaText = (n) => (n > 0 ? `${n} more` : n < 0 ? `${-n} less` : 'same');
const UNLOCK = require('@/assets/images/progress/unlock.svg');

/**
 * Figma "season overview card". Free: plain numbers + "Unlock performance
 * analysis". Pro: PRO badge, change vs. last season and "See performance
 * analysis". No matches in the season → the "No performance data yet" state.
 */
export default function SeasonCard({ season, summary, isPro, onPickSeason, onAnalysis }) {
  const empty = !summary?.matches;
  return (
    <StripedCard style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${seasonTitle(season)}, change season`}
            onPress={onPickSeason}
            style={styles.seasonRow}>
            <Text style={styles.season}>{seasonTitle(season)}</Text>
            <CaretDown size={24} color={colors.neutral.bg} />
          </Pressable>
          <Text style={styles.sub}>Your performance</Text>
        </View>
        {isPro ? <ProBadge /> : null}
      </View>

      {empty ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No performance data yet</Text>
          <Text style={styles.emptyText}>Play matches and track your stats to see your performance</Text>
        </View>
      ) : (
        <View style={styles.stats}>
          {STATS.map((s) => (
            <View key={s.key} style={[styles.stat, isPro && styles.statPro]}>
              <Image source={s.icon} style={[styles.statIcon, s.box, isPro && styles.statIconPro]} />
              <Text style={styles.statLabel}>{s.label}</Text>
              <Text style={styles.statValue}>{summary[s.key]}</Text>
              {isPro && summary.change[s.key] != null ? (
                <Delta value={summary.change[s.key]} text={deltaText(summary.change[s.key])} />
              ) : null}
            </View>
          ))}
        </View>
      )}

      {isPro ? (
        <Button type="white" size="small" label="See performance analysis" trailingIcon={CaretRight} onPress={onAnalysis} fullWidth />
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={onAnalysis}
          style={({ pressed }) => [styles.unlock, pressed && styles.pressed]}>
          <Image source={UNLOCK} style={styles.unlockIcon} />
          <Text style={styles.unlockText}>Unlock performance analysis</Text>
        </Pressable>
      )}
    </StripedCard>
  );
}

const styles = StyleSheet.create({
  card: { paddingHorizontal: 25, paddingTop: 21, paddingBottom: 20, gap: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerText: { flexShrink: 1 },
  seasonRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  season: { fontFamily: fonts.condensedBoldItalic, fontSize: 28, color: colors.neutral.bg, textTransform: 'uppercase' },
  sub: { fontFamily: fonts.medium, fontSize: 16, color: colors.primary[100] },

  stats: { flexDirection: 'row', gap: 12, marginTop: -4 },
  stat: {
    flex: 1,
    height: 80,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(34,47,141,0.6)',
  },
  statPro: { height: undefined, paddingVertical: 8, justifyContent: 'flex-start' },
  statIcon: { position: 'absolute', marginTop: 43 },
  statIconPro: { marginTop: 59 },
  statLabel: { fontFamily: fonts.medium, fontSize: 12, color: colors.neutral.bg },
  statValue: { fontFamily: fonts.condensedBoldItalic, fontSize: 44, lineHeight: 48, color: colors.neutral.bg },

  empty: { alignItems: 'center', gap: 4, paddingHorizontal: 8 },
  emptyTitle: { fontFamily: fonts.semibold, fontSize: 18, color: colors.white, textAlign: 'center' },
  emptyText: { fontFamily: fonts.medium, fontSize: 16, color: colors.primary[300], textAlign: 'center' },

  unlock: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  unlockIcon: { width: 20, height: 20 },
  unlockText: { fontFamily: fonts.semibold, fontSize: 16, color: colors.white },
  pressed: { opacity: 0.7 },
});
