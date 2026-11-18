import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CaretRight, X } from 'phosphor-react-native';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CaptionField } from '@/components/compose/MatchPostEditor';
import { ChipGroup, DateField, NotchLabel, SelectField, TimeField } from '@/components/compose/Pickers';
import Button from '@/components/ui/Button';
import PillTabs from '@/components/ui/PillTabs';
import Slider from '@/components/ui/Slider';
import { useUser } from '@/context/UserContext';
import { ACTIVITIES, FOCUS_OPTIONS, TRAINING_KINDS, TRAINING_LABELS, createTraining, durationBetween } from '@/lib/trainings';
import { colors, fonts } from '@/theme';

const TYPE_CARDS = [
  { value: 'individual', label: 'Individual', image: require('@/assets/images/training/individual.png') },
  { value: 'team', label: 'Team', image: require('@/assets/images/training/team.png'), shade: true },
  { value: 'recovery', label: 'Recovery', image: require('@/assets/images/training/recovery.png') },
  { value: 'match', label: 'Match', image: require('@/assets/images/training/match.png') },
];
const TABS = TRAINING_KINDS.map((k) => ({ id: k, label: TRAINING_LABELS[k] }));
const FOCUS = FOCUS_OPTIONS.map((f) => ({ value: f, label: f }));

function today() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

/**
 * Figma "Select training type" → "Log your training" (port of the web
 * AddTraining, log mode only). Saves to training_sessions, then opens the
 * Post about training composer for it (✕ there skips posting).
 * ?type=team|individual|recovery skips the first step.
 */
export default function AddTraining() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const { type: rawType } = useLocalSearchParams();
  const startType = TRAINING_KINDS.includes(rawType) ? rawType : null;

  const [step, setStep] = useState(startType ? 'log' : 'type');
  const [picked, setPicked] = useState(startType ?? 'individual');
  const [form, setForm] = useState({
    type: startType ?? 'individual',
    activity: '',
    other: '',
    date: today(),
    start: '',
    end: '',
    focus: null,
    description: '',
    effort: 3,
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const patch = (v) => setForm((f) => ({ ...f, ...v }));
  const clearError = (k) => setErrors((e) => ({ ...e, [k]: null }));

  const choose = () => {
    if (picked === 'match') return router.replace('/add-match');
    patch({ type: picked, activity: '', other: '' });
    setStep('log');
  };

  const submit = async () => {
    const e = {};
    if (!form.date) e.date = 'Date is required';
    if (!form.start || !form.end) e.time = 'Choose a start and end time';
    else if (form.start === form.end) e.time = 'End time must be after the start time';
    else if (durationBetween(form.start, form.end) > 12 * 60) e.time = 'That session is longer than 12 hours';
    if (form.activity === 'Other' && !form.other.trim()) e.other = 'Describe the type';
    setErrors(e);
    if (Object.keys(e).length || saving) return;

    setSaving(true);
    try {
      const id = await createTraining(user.id, {
        ...form,
        activity: form.activity === 'Other' ? form.other.trim() : form.activity,
      });
      router.replace({ pathname: '/post-about-training/[trainingId]', params: { trainingId: id } });
    } catch (err) {
      Alert.alert('Could not save your training', err?.message ?? 'Try again.');
      setSaving(false);
    }
  };

  const activities = ACTIVITIES[form.type];
  const showFocusAndEffort = form.type !== 'recovery';

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.title} accessibilityRole="header">
          {step === 'type' ? 'Select training type' : 'Log your training'}
        </Text>
        <Pressable onPress={() => router.back()} hitSlop={8} accessibilityRole="button" accessibilityLabel="Close">
          <X size={24} color={colors.black} />
        </Pressable>
      </View>

      {step === 'type' ? (
        <View style={styles.cards}>
          {TYPE_CARDS.map((c) => {
            const selected = picked === c.value;
            return (
              <Pressable
                key={c.value}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`${c.label} training`}
                onPress={() => setPicked(c.value)}
                style={[styles.card, selected && styles.cardSelected]}>
                <Image source={c.image} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition="bottom" />
                {c.shade ? (
                  <LinearGradient
                    colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)']}
                    locations={[0.5, 1]}
                    style={StyleSheet.absoluteFill}
                  />
                ) : null}
                <Text style={styles.cardLabel}>{c.label}</Text>
                <View style={styles.cardChevron}>
                  <CaretRight size={24} color={colors.white} />
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <PillTabs
              tabs={TABS}
              activeTab={form.type}
              onTabChange={(t) => patch({ type: t, activity: '', other: '' })}
              style={styles.tabs}
            />

            {activities.length ? (
              <View style={styles.block}>
                <Text style={styles.section}>Choose type</Text>
                <ChipGroup
                  options={activities.map((a) => ({ value: a, label: a }))}
                  value={form.activity}
                  onChange={(a) => {
                    patch({ activity: form.activity === a ? '' : a });
                    clearError('other');
                  }}
                />
                {form.activity === 'Other' ? (
                  <View style={styles.otherWrap}>
                    <TextInput
                      value={form.other}
                      onChangeText={(v) => {
                        patch({ other: v });
                        clearError('other');
                      }}
                      placeholder="e.g. Swimming"
                      placeholderTextColor={colors.neutral[700]}
                      autoFocus
                      maxLength={40}
                      accessibilityLabel="Other type"
                      style={[styles.otherInput, errors.other && styles.inputError]}
                    />
                    <NotchLabel label="Other type" required />
                    {errors.other ? <Text style={styles.error}>{errors.other}</Text> : null}
                  </View>
                ) : null}
              </View>
            ) : null}

            {form.type === 'recovery' ? (
              <CaptionField
                label="Add description"
                placeholder="Describe your recovery..."
                minHeight={72}
                value={form.description}
                onChangeText={(v) => patch({ description: v })}
              />
            ) : null}

            <DateField
              label="Date"
              required
              sheetTitle="Date"
              value={form.date}
              onChange={(v) => {
                patch({ date: v });
                clearError('date');
              }}
              error={errors.date}
            />

            <View>
              <View style={styles.timeRow}>
                <TimeField
                  label="Start time"
                  required
                  value={form.start}
                  onChange={(v) => {
                    patch({ start: v });
                    clearError('time');
                  }}
                  style={styles.cell}
                />
                <View style={styles.dash} />
                <TimeField
                  label="End time"
                  required
                  value={form.end}
                  onChange={(v) => {
                    patch({ end: v });
                    clearError('time');
                  }}
                  style={styles.cell}
                />
              </View>
              {errors.time ? <Text style={styles.error}>{errors.time}</Text> : null}
            </View>

            {showFocusAndEffort ? (
              <>
                <SelectField
                  label="Session focus"
                  title="Session focus"
                  placeholder="Select"
                  value={form.focus}
                  options={FOCUS}
                  onChange={(v) => patch({ focus: v })}
                />
                <View>
                  <Text style={styles.section}>Effort rating</Text>
                  <Slider value={form.effort} onChange={(v) => patch({ effort: v })} label="Effort rating" />
                </View>
              </>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {step === 'type' ? (
          <Button size="big" type="primary" label="Select" onPress={choose} />
        ) : (
          <Button
            size="big"
            type="primary"
            label={saving ? 'Saving…' : 'Submit training session'}
            disabled={saving}
            onPress={submit}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.neutral.bg },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  title: { fontFamily: fonts.semibold, fontSize: 18, lineHeight: 24, letterSpacing: -0.18, color: colors.black },

  cards: { flex: 1, gap: 10, padding: 16 },
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    padding: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
    backgroundColor: colors.neutral[900],
  },
  cardSelected: { borderColor: colors.primary.default },
  cardLabel: {
    fontFamily: fonts.condensedBoldItalic,
    fontSize: 32,
    textTransform: 'uppercase',
    color: colors.primary[50],
  },
  cardChevron: {
    padding: 8,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: colors.white,
  },

  body: { padding: 16, gap: 20, paddingBottom: 32 },
  tabs: { paddingHorizontal: 0, paddingVertical: 0 },
  block: { gap: 8 },
  section: { fontFamily: fonts.semibold, fontSize: 16, color: colors.black },
  otherWrap: { marginTop: 12 },
  otherInput: {
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    backgroundColor: colors.white,
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.black,
  },
  inputError: { borderColor: colors.negative.default },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  cell: { flex: 1 },
  dash: { width: 8, height: 1.5, marginHorizontal: 4, borderRadius: 1, backgroundColor: colors.neutral[300] },
  error: { fontFamily: fonts.medium, fontSize: 12, color: colors.negative.default, marginTop: 4 },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    backgroundColor: colors.neutral.bg,
  },
});
