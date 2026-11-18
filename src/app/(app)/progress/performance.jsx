import { useFocusEffect, useRouter } from 'expo-router';
import { Barbell, CaretRight, CourtBasketball, Heartbeat, SneakerMove, SoccerBall } from 'phosphor-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PageTopbar } from '@/components/navigation/Topbar';
import PerformanceChart from '@/components/progress/PerformanceChart';
import { CARD_SHADOW, Delta, MUTED, TipCard } from '@/components/progress/ProgressUI';
import SkillRadar from '@/components/progress/SkillRadar';
import { useUser } from '@/context/UserContext';
import useProgressData from '@/hooks/useProgressData';
import { fetchSkills, predictions, seasonSeries, seasonVerdict, trainingImpact } from '@/lib/progress';
import { colors, fonts } from '@/theme';

const STATS = [
  { key: 'goals', label: 'Goals', icon: SoccerBall, word: 'goals' },
  { key: 'assists', label: 'Assists', icon: SneakerMove, word: 'assists' },
  { key: 'matches', label: 'Matches', icon: CourtBasketball, word: 'matches' },
];
const IMPACT_ICONS = { load: SneakerMove, recovery: Heartbeat, gym: Barbell };

/**
 * Figma "Performance analysis" (Pro). Everything is worked out from the
 * athlete's own matches and trainings; Skill trends from the "Profile of
 * player" ratings (player_skills), this season vs last.
 */
export default function Performance() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { matches, trainings, loading } = useProgressData();
  const [stat, setStat] = useState('goals');
  const { user } = useUser();
  const uid = user?.id;
  const [skills, setSkills] = useState(null);

  // Reload after coming back from the skills screen.
  useFocusEffect(
    useCallback(() => {
      if (!uid) return undefined;
      let cancelled = false;
      fetchSkills(uid)
        .then((s) => !cancelled && setSkills(s))
        .catch(() => !cancelled && setSkills({ current: null, previous: null }));
      return () => {
        cancelled = true;
      };
    }, [uid]),
  );

  const current = STATS.find((s) => s.key === stat);
  const series = seasonSeries(matches, stat);
  const verdict = seasonVerdict(series, current.word);
  const preds = predictions(matches);
  const impact = trainingImpact(matches, trainings);

  return (
    <View style={styles.screen}>
      <PageTopbar title="Performance" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
        {loading ? <ActivityIndicator color={colors.primary.default} /> : null}

        <View style={styles.card}>
          <View style={styles.statTabs} accessibilityRole="tablist">
            {STATS.map((s) => {
              const on = s.key === stat;
              return (
                <Pressable
                  key={s.key}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: on }}
                  onPress={() => setStat(s.key)}
                  style={[styles.statTab, on && styles.statTabOn]}>
                  <s.icon size={18} color={on ? colors.white : MUTED} />
                  <Text style={[styles.statTabText, on && styles.statTabTextOn]}>{s.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <PerformanceChart series={series} width={width - 48} />
          <TipCard title={verdict.title} text={verdict.text} />
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Performance predictions</Text>
          <View style={styles.preds}>
            {preds.map((p) => (
              <View key={p.key} style={styles.pred}>
                <Text style={styles.predLabel}>{p.label}</Text>
                <Text style={styles.predValue} adjustsFontSizeToFit numberOfLines={1}>
                  {p.value}
                </Text>
                <Text style={styles.predSub}>this season</Text>
                {p.change != null ? (
                  <Delta value={p.change} text={`${Math.abs(p.change)}% vs last season`} pill size={12} upColor={colors.success[600]} />
                ) : (
                  <Text style={styles.predSub}>no last season</Text>
                )}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Skill trends</Text>
          {skills ? (
            <SkillRadar skills={skills} width={width - 32} onEdit={() => router.push('/progress/skills')} />
          ) : (
            <ActivityIndicator color={colors.primary.default} />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Training impact</Text>
          <View style={styles.impact}>
            {impact.map((row, i) => {
              const Icon = IMPACT_ICONS[row.key];
              return (
                <View key={row.key} style={[styles.impactRow, i < impact.length - 1 && styles.border]}>
                  <View style={styles.impactIcon}>
                    <Icon size={16} color={colors.primary.default} />
                  </View>
                  <View style={styles.impactText}>
                    <Text style={styles.impactLabel}>{row.label}</Text>
                    <Text style={styles.impactSub}>{row.value == null ? 'Log more matches and trainings' : row.sub}</Text>
                  </View>
                  <Text style={styles.impactValue}>
                    {row.value == null ? '–' : `${row.value > 0 ? '+' : ''}${row.value}%`}
                  </Text>
                </View>
              );
            })}
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/progress/trainings')}
            style={styles.link}>
            <Text style={styles.linkText}>See trainings</Text>
            <CaretRight size={20} color={colors.primary.default} />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.neutral.bg },
  content: { padding: 16, gap: 32 },
  card: { padding: 8, gap: 8, borderRadius: 12, backgroundColor: colors.white, ...CARD_SHADOW },
  statTabs: { flexDirection: 'row', gap: 8 },
  statTab: {
    flex: 1,
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 8,
    backgroundColor: colors.neutral.bg,
  },
  statTabOn: { backgroundColor: colors.primary.default },
  statTabText: { fontFamily: fonts.semibold, fontSize: 14, color: MUTED },
  statTabTextOn: { color: colors.white },

  section: { gap: 12 },
  heading: { fontFamily: fonts.semibold, fontSize: 16, color: colors.black },
  preds: { flexDirection: 'row', gap: 8 },
  pred: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingTop: 4,
    paddingBottom: 8,
    gap: 2,
    borderRadius: 12,
    backgroundColor: colors.white,
    ...CARD_SHADOW,
  },
  predLabel: { fontFamily: fonts.medium, fontSize: 14, color: colors.black, textTransform: 'uppercase' },
  predValue: { fontFamily: fonts.condensedBoldItalic, fontSize: 44, lineHeight: 48, color: colors.black },
  predSub: { fontFamily: fonts.semibold, fontSize: 10, color: MUTED, marginBottom: 6 },

  impact: { borderRadius: 12, backgroundColor: colors.white, overflow: 'hidden', ...CARD_SHADOW },
  impactRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12 },
  border: { borderBottomWidth: 1, borderBottomColor: colors.neutral[200] },
  impactIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[50],
  },
  impactText: { flex: 1, gap: 3 },
  impactLabel: { fontFamily: fonts.semibold, fontSize: 14, color: colors.black },
  impactSub: { fontFamily: fonts.medium, fontSize: 12, color: MUTED },
  impactValue: { fontFamily: fonts.semiboldItalic, fontSize: 22, color: colors.black, textTransform: 'uppercase' },
  link: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, height: 36 },
  linkText: { fontFamily: fonts.semibold, fontSize: 16, color: colors.primary.default },
});
