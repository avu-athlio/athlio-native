import { useLocalSearchParams, useRouter } from 'expo-router';
import { Plus } from 'phosphor-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PageTopbar } from '@/components/navigation/Topbar';
import { LockedFeature, MUTED, PeriodTabs, TipCard } from '@/components/progress/ProgressUI';
import { TargetRow } from '@/components/progress/TargetCards';
import { useUser } from '@/context/UserContext';
import useProgressData from '@/hooks/useProgressData';
import { FREE_TARGET_LIMIT, TARGET_PERIODS, deleteTarget, suggestTarget } from '@/lib/progress';
import { colors, fonts } from '@/theme';

const BANNER = {
  season: ['Season targets', 'Track your progress and achieve your best season yet'],
  month: ['Monthly targets', 'Track your progress and achieve your best month yet'],
  week: ['Weekly targets', 'Track your progress and achieve your best week yet'],
};
const EMPTY = { season: 'season', month: 'monthly', week: 'weekly' };

/** Figma "Targets": Season / Month / Week lists (Month and Week are Pro). */
export default function Targets() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { period: periodParam } = useLocalSearchParams();
  const { user, profile } = useUser();
  const isPro = !!profile?.is_pro;
  const { matches, targets, targetsReady, loading, reload } = useProgressData();
  const [period, setPeriod] = useState(TARGET_PERIODS.some((p) => p.value === periodParam) ? periodParam : 'season');

  const locked = !isPro && period !== 'season';
  const list = targets.filter((t) => t.period === period);
  const met = list.filter((t) => t.met).length;
  const [title, sub] = BANNER[period];
  const suggestion = suggestTarget(matches, period);

  const add = () => {
    if (!isPro && targets.filter((t) => t.period === 'season').length >= FREE_TARGET_LIMIT) {
      router.push('/pro');
      return;
    }
    router.push({ pathname: '/progress/target', params: { period } });
  };
  const remove = (t) =>
    Alert.alert('Delete this target?', `“${t.name}” will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          deleteTarget(user.id, t.id)
            .then(reload)
            .catch((e) => Alert.alert('Could not delete the target', e?.message ?? 'Try again.')),
      },
    ]);

  return (
    <View style={styles.screen}>
      <PageTopbar title="Targets" />
      <View style={styles.tabs}>
        <PeriodTabs tabs={TARGET_PERIODS} value={period} onChange={setPeriod} />
      </View>

      {locked ? (
        <View style={styles.center}>
          <LockedFeature text="Unlock unlimited targets with Pro and track your progress every month and week." onUnlock={() => router.push('/pro')} />
        </View>
      ) : !targetsReady ? (
        <View style={styles.center}>
          <Text style={styles.note}>Targets aren’t set up on the server yet.</Text>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}>
            <View style={styles.banner}>
              <View style={styles.bannerText}>
                <Text style={styles.bannerTitle}>{title}</Text>
                <Text style={styles.bannerSub}>{sub}</Text>
              </View>
              <View style={styles.met}>
                <View style={styles.metRow}>
                  <Text style={styles.metBig}>{met}</Text>
                  <Text style={styles.metOf}>/{list.length}</Text>
                </View>
                <Text style={styles.metLabel}>targets met</Text>
              </View>
            </View>

            {loading && !list.length ? <ActivityIndicator color={colors.primary.default} /> : null}

            {list.map((t) => (
              <TargetRow
                key={t.id}
                target={t}
                onPress={() => router.push({ pathname: '/progress/target', params: { id: t.id } })}
                onDelete={() => remove(t)}
              />
            ))}

            {!loading && !list.length ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>Track your progress and add your first {EMPTY[period]} target</Text>
                <RoundAdd onPress={add} label="Add target" />
              </View>
            ) : null}
          </ScrollView>

          {list.length ? (
            <View style={[styles.fab, { bottom: insets.bottom + 16 }]}>
              <Text style={styles.fabLabel}>Add target</Text>
              <RoundAdd onPress={add} label="Add target" />
            </View>
          ) : (
            <View style={[styles.tip, { bottom: insets.bottom + 16 }]}>
              <TipCard title={suggestion.title} text={suggestion.text} />
            </View>
          )}
        </>
      )}
    </View>
  );
}

function RoundAdd({ onPress, label }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.round, pressed && styles.pressed]}>
      <Plus size={28} color={colors.white} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.neutral.bg },
  tabs: { paddingHorizontal: 16, paddingTop: 8 },
  content: { padding: 16, gap: 8 },
  center: { flex: 1, justifyContent: 'center', padding: 16 },
  note: { fontFamily: fonts.medium, fontSize: 14, color: MUTED, textAlign: 'center' },

  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: 12,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: colors.primary[800],
  },
  bannerText: { flex: 1 },
  bannerTitle: { fontFamily: fonts.condensedBoldItalic, fontSize: 24, color: colors.white, textTransform: 'uppercase' },
  bannerSub: { fontFamily: fonts.medium, fontSize: 14, color: colors.neutral[300] },
  met: { alignItems: 'center', paddingHorizontal: 16, paddingBottom: 8, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.2)' },
  metRow: { flexDirection: 'row', alignItems: 'flex-end' },
  metBig: { fontFamily: fonts.condensedBoldItalic, fontSize: 44, lineHeight: 48, color: colors.white },
  metOf: { fontFamily: fonts.condensedMedium, fontSize: 18, color: colors.neutral[300], marginBottom: 6 },
  metLabel: { fontFamily: fonts.condensedSemiboldItalic, fontSize: 14, color: colors.neutral[300], textTransform: 'uppercase' },

  empty: { alignItems: 'center', gap: 16, paddingTop: 120 },
  emptyText: { fontFamily: fonts.medium, fontSize: 16, color: colors.black, textAlign: 'center', maxWidth: 220 },
  round: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.default,
  },
  pressed: { opacity: 0.8 },
  fab: { position: 'absolute', right: 24, alignItems: 'center', gap: 8 },
  fabLabel: { fontFamily: fonts.semibold, fontSize: 16, color: colors.black },
  tip: { position: 'absolute', left: 16, right: 16 },
});
