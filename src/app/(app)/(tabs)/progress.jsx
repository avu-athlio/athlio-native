import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OptionSheet } from '@/components/compose/Pickers';
import { useTabBarSpace } from '@/components/navigation/TabBar';
import Leaderboard from '@/components/progress/Leaderboard';
import { DropdownChip, MUTED, PaywallCard, PeriodTabs, SectionHeader } from '@/components/progress/ProgressUI';
import SeasonCard from '@/components/progress/SeasonCard';
import { TargetGauge, TargetsEmpty } from '@/components/progress/TargetCards';
import { DayHero, WeekStrip } from '@/components/progress/TrainingDays';
import { useUser } from '@/context/UserContext';
import useProgressData from '@/hooks/useProgressData';
import {
  FREE_TARGET_LIMIT,
  LEADERBOARD_SCOPES,
  TARGET_PERIODS,
  addDays,
  currentSeason,
  dateKey,
  dayKind,
  dayMap,
  dayStatus,
  fetchLeaderboard,
  seasonSummary,
  seasonTitle,
  seasonsOf,
  startOfWeek,
} from '@/lib/progress';
import { colors, fonts } from '@/theme';

const WEEK_LABELS = ['M', 'T', 'W', 'TH', 'F', 'SA', 'S'];
const PERIOD_WORD = { season: 'season', month: 'month', week: 'week' };
const LOCKED_PREVIEW = require('@/assets/images/progress/locked-preview.png');

/**
 * Figma "Progress main page" (free) and "PRO Progress page". Pro is
 * profiles.is_pro; free athletes get season targets only and the paywall.
 * Profile visibility, Challenges and Compare are a later phase.
 */
export default function Progress() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarSpace = useTabBarSpace();
  const { profile } = useUser();
  const isPro = !!profile?.is_pro;
  const { matches, trainings, planned, plannedMatches, targets, targetsReady, loading, error, reload } = useProgressData();

  const [season, setSeason] = useState(currentSeason);
  const [seasonSheet, setSeasonSheet] = useState(false);
  const [period, setPeriod] = useState('season');
  const [scope, setScope] = useState('world');
  const [scopeSheet, setScopeSheet] = useState(false);
  const [board, setBoard] = useState({ key: null, rows: [], error: null });

  const boardKey = profile ? `${profile.id}:${season}:${scope}` : null;
  useEffect(() => {
    if (!profile) return undefined;
    let cancelled = false;
    const key = `${profile.id}:${season}:${scope}`;
    fetchLeaderboard(profile, season, scope)
      .then((rows) => !cancelled && setBoard({ key, rows, error: null }))
      .catch((e) => !cancelled && setBoard({ key, rows: [], error: e }));
    return () => {
      cancelled = true;
    };
  }, [profile, season, scope]);

  const goPro = () => router.push('/pro');
  const summary = seasonSummary(matches, season);
  const seasons = seasonsOf(matches);

  // This week, Monday → Sunday.
  const days = dayMap(trainings, matches, planned, plannedMatches);
  const todayKey = dateKey(new Date());
  const monday = startOfWeek(new Date());
  const week = WEEK_LABELS.map((short, i) => {
    const key = dateKey(addDays(monday, i));
    const day = days.get(key);
    return { key, short, label: short, kind: dayKind(day), dot: dayStatus(day, key, todayKey), today: key === todayKey };
  });
  const todayMatch = days.get(todayKey)?.matches[0];
  const todayPlannedMatch = days.get(todayKey)?.plannedMatches[0];

  const periodTargets = targets.filter((t) => t.period === period);
  const addTarget = () => {
    if (!isPro && targets.filter((t) => t.period === 'season').length >= FREE_TARGET_LIMIT) return goPro();
    router.push({ pathname: '/progress/target', params: { period } });
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: tabBarSpace + 24 }]}
        showsVerticalScrollIndicator={false}>
        {loading ? <ActivityIndicator color={colors.primary.default} style={styles.loader} /> : null}
        {error ? (
          <Pressable accessibilityRole="button" onPress={reload} style={styles.error}>
            <Text style={styles.errorText}>Couldn’t load your progress. Tap to try again.</Text>
          </Pressable>
        ) : null}

        <SeasonCard
          season={season}
          summary={summary}
          isPro={isPro}
          onPickSeason={() => setSeasonSheet(true)}
          onAnalysis={() => (isPro ? router.push('/progress/performance') : goPro())}
        />

        {isPro ? (
          <View style={styles.section}>
            <SectionHeader
              title="Trainings"
              subtitle="Work on your goals and track them"
              onSeeAll={() => router.push('/progress/trainings')}
            />
            <View style={styles.trainings}>
              <WeekStrip days={week} onPressDay={(d) => router.push({ pathname: '/progress/trainings', params: { day: d.key } })} />
              {todayMatch ? (
                <DayHero
                  tag="Match day"
                  action="Post about your match"
                  onAction={() =>
                    router.push({ pathname: '/post-about-match/[matchId]', params: { matchId: todayMatch.id } })
                  }
                />
              ) : todayPlannedMatch ? (
                <DayHero
                  tag="Match day"
                  action="Log your performance after game"
                  onAction={() => router.push({ pathname: '/add-match', params: { planned: todayPlannedMatch.id } })}
                />
              ) : (
                <DayHero action="Log your training" onAction={() => router.push('/add-training')} />
              )}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <SectionHeader
            title="Targets"
            subtitle="Work on your goals and track them"
            onSeeAll={() => router.push({ pathname: '/progress/targets', params: { period } })}
          />
          <PeriodTabs
            tabs={TARGET_PERIODS}
            value={period}
            onChange={setPeriod}
            locked={isPro ? [] : ['month', 'week']}
            onLocked={goPro}
          />
          {!targetsReady ? (
            <Text style={styles.note}>Targets aren’t set up on the server yet.</Text>
          ) : periodTargets.length ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              alwaysBounceVertical={false}
              directionalLockEnabled
              style={styles.cardsScroll}
              contentContainerStyle={styles.cards}>
              {periodTargets.map((t) => (
                <TargetGauge
                  key={t.id}
                  target={t}
                  onPress={() => router.push({ pathname: '/progress/target', params: { id: t.id } })}
                />
              ))}
            </ScrollView>
          ) : (
            <TargetsEmpty periodLabel={PERIOD_WORD[period]} onAdd={addTarget} />
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader
            title="Leaderboard"
            subtitle="Ranking your position and age"
            right={
              <DropdownChip
                label={LEADERBOARD_SCOPES.find((s) => s.value === scope).label}
                onPress={() => setScopeSheet(true)}
              />
            }
          />
          <Leaderboard
            rows={board.rows}
            loading={board.key !== boardKey}
            error={board.error}
            onPressPlayer={(p) =>
              p.isMe ? router.push('/profile') : router.push({ pathname: '/profile/[id]', params: { id: p.id } })
            }
          />
        </View>

        {isPro ? null : (
          <>
            <PaywallCard onUnlock={goPro} />
            <View style={styles.preview} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <Image source={LOCKED_PREVIEW} style={StyleSheet.absoluteFill} contentFit="cover" blurRadius={8} />
              <View style={styles.previewVeil} />
            </View>
          </>
        )}
      </ScrollView>

      <OptionSheet
        visible={seasonSheet}
        title="Pick the season"
        options={seasons.map((y) => ({ value: y, label: seasonTitle(y) }))}
        value={season}
        onSelect={(y) => {
          setSeason(y);
          setSeasonSheet(false);
        }}
        onClose={() => setSeasonSheet(false)}
      />
      <OptionSheet
        visible={scopeSheet}
        title="Leaderboard selection"
        options={LEADERBOARD_SCOPES}
        value={scope}
        onSelect={(s) => {
          setScope(s);
          setScopeSheet(false);
        }}
        onClose={() => setScopeSheet(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.neutral.bg },
  content: { paddingHorizontal: 16, gap: 40 },
  loader: { position: 'absolute', top: 8, alignSelf: 'center' },
  error: { padding: 12, borderRadius: 12, backgroundColor: colors.negative[50] },
  errorText: { fontFamily: fonts.medium, fontSize: 14, color: colors.negative[700], textAlign: 'center' },
  section: { gap: 16 },
  trainings: { gap: 8 },
  // Padding leaves room for the card shadows; the negative margin sits on the
  // ScrollView (not its content) so the content isn't taller than the frame.
  cardsScroll: { marginHorizontal: -16, marginVertical: -12, flexGrow: 0 },
  cards: { gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  note: { fontFamily: fonts.medium, fontSize: 14, color: MUTED },
  preview: { height: 394, overflow: 'hidden', marginTop: -16 },
  previewVeil: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(246,246,247,0.5)' },
});
