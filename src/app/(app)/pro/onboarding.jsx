import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CARD_SHADOW, MUTED, PRO_GRADIENT } from '@/components/progress/ProgressUI';
import SkillsForm, { DEFAULT_SKILLS, SKILL_FORM } from '@/components/progress/SkillsForm';
import Button from '@/components/ui/Button';
import { useUser } from '@/context/UserContext';
import { planFromSchedule, saveTrainingSchedule } from '@/lib/pro';
import { fetchSkills, saveSkills } from '@/lib/progress';
import { colors, fonts } from '@/theme';

const STEPS = 3;
const DAYS = ['M', 'T', 'W', 'TH', 'F', 'SA', 'S'];
const APPS = [
  { key: 'apple', icon: require('@/assets/images/pro/app-apple-health.png'), title: 'Connect with Apple Health', text: 'Import workouts from Health app.' },
  { key: 'strava', icon: require('@/assets/images/pro/app-strava.jpg'), title: 'Connect with Strava', text: 'Import your activities and workouts.' },
  { key: 'google', icon: require('@/assets/images/pro/app-google-fit.png'), title: 'Connect with Google Fit', text: 'Import workouts from Health app.' },
];

function DayRow({ title, value, onChange }) {
  return (
    <View style={styles.block}>
      <Text style={styles.blockTitle}>{title}</Text>
      <View style={styles.days}>
        {DAYS.map((d, i) => {
          const on = value.includes(i);
          return (
            <Pressable
              key={d}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={`${title}: ${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][i]}`}
              onPress={() => onChange(on ? value.filter((x) => x !== i) : [...value, i].sort())}
              style={[styles.day, on && styles.dayOn]}>
              <Text style={styles.dayText}>{d}</Text>
              <View style={[styles.dot, on && styles.dotOn]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/**
 * Figma "Onboarding to pro" 1–3: training schedule, Profile of player
 * (skills — the Skill trends radar reads these), connect apps. Then the
 * "You're ready" screen. Steps are saved as you go.
 */
export default function ProOnboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile } = useUser();
  const [step, setStep] = useState(1);
  const [schedule, setSchedule] = useState(() => ({
    team: profile?.training_schedule?.team ?? [],
    individual: profile?.training_schedule?.individual ?? [],
  }));
  const [skills, setSkills] = useState(DEFAULT_SKILLS);
  const [busy, setBusy] = useState(false);

  // Start the skills step from earlier ratings, if any.
  useEffect(() => {
    if (!user) return undefined;
    let cancelled = false;
    fetchSkills(user.id)
      .then(({ current, previous }) => {
        const row = current ?? previous;
        if (!cancelled && row) setSkills(Object.fromEntries(SKILL_FORM.map((s) => [s.key, row[s.key]])));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Saving never blocks the flow: a missing table just means it's not kept yet.
  const next = async () => {
    setBusy(true);
    try {
      if (step === 1) {
        await saveTrainingSchedule(user.id, schedule).catch(() => {});
        setStep(2);
      } else if (step === 2) {
        await saveSkills(user.id, skills).catch(() => {});
        setStep(3);
      } else {
        await planFromSchedule(user.id, schedule).catch(() => 0);
        router.replace('/pro/ready');
      }
    } finally {
      setBusy(false);
    }
  };

  const back = () => (step > 1 ? setStep(step - 1) : router.back());

  return (
    <View style={styles.screen}>
      <View style={[styles.top, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={back} hitSlop={8} accessibilityRole="button" accessibilityLabel="Back" style={styles.backBtn}>
          <ArrowLeft size={24} color={colors.black} />
        </Pressable>
        <View
          style={styles.progress}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 1, max: STEPS, now: step }}>
          <LinearGradient
            colors={PRO_GRADIENT}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[styles.progressFill, { width: `${(step / STEPS) * 100}%` }]}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {step === 1 ? (
          <>
            <View>
              <Text style={styles.title} accessibilityRole="header">
                Training schedule
              </Text>
              <Text style={styles.sub}>Pick the days you have trainings</Text>
            </View>
            <DayRow title="Team trainings" value={schedule.team} onChange={(team) => setSchedule((s) => ({ ...s, team }))} />
            <DayRow
              title="Individual trainings"
              value={schedule.individual}
              onChange={(individual) => setSchedule((s) => ({ ...s, individual }))}
            />
          </>
        ) : null}

        {step === 2 ? <SkillsForm values={skills} onChange={setSkills} /> : null}

        {step === 3 ? (
          <>
            <View>
              <Text style={styles.title} accessibilityRole="header">
                Connect apps
              </Text>
              <Text style={styles.sub}>Pick the apps you want to connect</Text>
            </View>
            <View style={styles.apps}>
              {APPS.map((a) => (
                <Pressable
                  key={a.key}
                  accessibilityRole="button"
                  onPress={() => Alert.alert('Coming soon', `${a.title.replace('Connect with ', '')} can’t be connected yet.`)}
                  style={({ pressed }) => [styles.app, pressed && styles.pressed]}>
                  <Image source={a.icon} style={styles.appIcon} contentFit="contain" />
                  <View style={styles.appText}>
                    <Text style={styles.appTitle}>{a.title}</Text>
                    <Text style={styles.appSub}>{a.text}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        {step === 3 ? (
          <>
            <Button type="subtle" size="medium" label="Skip" onPress={next} disabled={busy} style={styles.skip} />
            <Button size="medium" label="Continue" onPress={next} disabled={busy} style={styles.flex} />
          </>
        ) : (
          <Button size="big" label="Continue" onPress={next} disabled={busy} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.neutral.bg },
  top: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 16 },
  backBtn: { padding: 4 },
  progress: { flex: 1, height: 8, borderRadius: 8, overflow: 'hidden', backgroundColor: colors.neutral[200] },
  progressFill: { height: 8, borderRadius: 8 },
  body: { padding: 16, paddingTop: 20, gap: 40 },
  title: { fontFamily: fonts.condensedBoldItalic, fontSize: 44, lineHeight: 48, color: colors.black, textTransform: 'uppercase' },
  sub: { fontFamily: fonts.medium, fontSize: 16, color: MUTED },
  block: { gap: 12 },
  blockTitle: { fontFamily: fonts.semibold, fontSize: 18, lineHeight: 24, letterSpacing: -0.18, color: colors.black },
  days: { flexDirection: 'row', gap: 4 },
  day: {
    flex: 1,
    height: 99,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: colors.neutral[100],
  },
  dayOn: { borderColor: '#5d6bfd', backgroundColor: colors.white },
  dayText: { fontFamily: fonts.condensedSemibold, fontSize: 20, letterSpacing: -1, color: colors.black },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.neutral[300] },
  dotOn: { backgroundColor: colors.primary.default },
  apps: { gap: 16, marginTop: -16 },
  app: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 86,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.white,
    ...CARD_SHADOW,
  },
  pressed: { opacity: 0.8 },
  appIcon: { width: 60, height: 60, borderRadius: 12, borderWidth: 1, borderColor: colors.neutral[200] },
  appText: { flex: 1, gap: 4 },
  appTitle: { fontFamily: fonts.semibold, fontSize: 16, color: colors.black },
  appSub: { fontFamily: fonts.medium, fontSize: 14, color: MUTED },
  footer: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 8 },
  skip: { flex: 0.6 },
  flex: { flex: 1 },
});
