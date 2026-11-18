import { useLocalSearchParams, useRouter } from 'expo-router';
import { X } from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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

import { NotchLabel, NumberStepper, SelectField } from '@/components/compose/Pickers';
import Button from '@/components/ui/Button';
import { useUser } from '@/context/UserContext';
import {
  TARGET_CATEGORIES,
  TARGET_PERIODS,
  TARGET_UNITS,
  deleteTarget,
  fetchTarget,
  saveTarget,
  targetsMissing,
} from '@/lib/progress';
import { colors, fonts } from '@/theme';

// Bigger steps for minute targets so the stepper stays usable.
const STEP = { minutes: 10, training_minutes: 15 };
const MAX = { minutes: 10000, training_minutes: 20000 };
const DEFAULT = { goals: 5, assists: 5, matches: 10, minutes: 900, sessions: 12, training_minutes: 600 };
const PERIOD_WORD = { season: 'this season', month: 'this month', week: 'this week' };

const unitLabel = (unit) =>
  [...TARGET_UNITS.performance, ...TARGET_UNITS.training].find((u) => u.value === unit)?.label ?? unit;
const autoName = (f) => `${f.target_value} ${unitLabel(f.unit).toLowerCase()} ${PERIOD_WORD[f.period]}`;

/**
 * Figma "Add your target" / "Edit your target". ?id= edits, ?period= presets
 * the deadline. Until a name is typed it follows the choices
 * ("20 goals this season").
 */
export default function TargetEditor() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, period: periodParam } = useLocalSearchParams();
  const { user, profile } = useUser();
  const isPro = !!profile?.is_pro;
  const editing = typeof id === 'string';

  const startPeriod = TARGET_PERIODS.some((p) => p.value === periodParam) && (isPro || periodParam === 'season') ? periodParam : 'season';
  const [form, setForm] = useState({
    name: '',
    period: startPeriod,
    category: 'performance',
    unit: 'goals',
    target_value: DEFAULT.goals,
  });
  const [named, setNamed] = useState(false);
  const [loaded, setLoaded] = useState(!editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!editing || !user) return undefined;
    let cancelled = false;
    fetchTarget(user.id, id)
      .then((t) => {
        if (cancelled) return;
        if (t) {
          setForm(t);
          setNamed(true);
        }
        setLoaded(true);
      })
      .catch(() => !cancelled && setLoaded(true));
    return () => {
      cancelled = true;
    };
  }, [editing, id, user]);

  const patch = (v) => setForm((f) => ({ ...f, ...v }));
  const name = named ? form.name : autoName(form);
  const periods = isPro ? TARGET_PERIODS : TARGET_PERIODS.filter((p) => p.value === 'season' || p.value === form.period);

  const submit = async () => {
    if (!name.trim()) {
      setError('Give your target a name');
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      await saveTarget(user.id, { ...form, id: editing ? id : undefined, name });
      router.back();
    } catch (e) {
      setSaving(false);
      Alert.alert(
        'Could not save your target',
        targetsMissing(e) ? 'Targets aren’t set up on the server yet.' : (e?.message ?? 'Try again.'),
      );
    }
  };

  const remove = () =>
    Alert.alert('Delete this target?', `“${name}” will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          deleteTarget(user.id, id)
            .then(() => router.back())
            .catch((e) => Alert.alert('Could not delete the target', e?.message ?? 'Try again.')),
      },
    ]);

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.title} accessibilityRole="header">
          {editing ? 'Edit your target' : 'Add your target'}
        </Text>
        <Pressable onPress={() => router.back()} hitSlop={8} accessibilityRole="button" accessibilityLabel="Close">
          <X size={24} color={colors.black} />
        </Pressable>
      </View>

      {!loaded ? (
        <ActivityIndicator style={styles.loader} color={colors.primary.default} />
      ) : (
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <View>
            <TextInput
              value={name}
              onChangeText={(t) => {
                setNamed(true);
                setError(null);
                patch({ name: t });
              }}
              placeholder="Target name"
              placeholderTextColor={colors.neutral[700]}
              maxLength={80}
              accessibilityLabel="Target name, required"
              style={[styles.input, error && styles.inputError]}
            />
            <NotchLabel label="Target name" required />
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
          <SelectField
            label="Deadline"
            required
            title="Deadline"
            value={form.period}
            options={periods}
            onChange={(v) => patch({ period: v })}
          />
          <SelectField
            label="Category"
            required
            title="Category"
            value={form.category}
            options={TARGET_CATEGORIES}
            onChange={(v) => {
              const unit = TARGET_UNITS[v][0].value;
              patch({ category: v, unit, target_value: DEFAULT[unit] });
            }}
          />
          <SelectField
            label="Unit"
            required
            title="Unit"
            value={form.unit}
            options={TARGET_UNITS[form.category]}
            onChange={(v) => patch({ unit: v, target_value: DEFAULT[v] })}
          />
          <View style={styles.valueBlock}>
            <Text style={styles.valueLabel}>
              Target value<Text style={styles.required}> *</Text>
            </Text>
            <NumberStepper
              value={form.target_value}
              onChange={(v) => patch({ target_value: v })}
              min={STEP[form.unit] ?? 1}
              max={MAX[form.unit] ?? 1000}
              step={STEP[form.unit] ?? 1}
              label="Target value"
              style={styles.stepper}
            />
          </View>
        </ScrollView>
      )}

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {editing ? (
          <Pressable accessibilityRole="button" onPress={remove} style={({ pressed }) => [styles.delete, pressed && styles.pressed]}>
            <Text style={styles.deleteText}>Delete this target</Text>
          </Pressable>
        ) : null}
        <Button
          size="medium"
          label={editing ? 'Save' : 'Add target'}
          onPress={submit}
          disabled={!loaded || saving}
          style={styles.flex}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.neutral.bg },
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
  loader: { marginTop: 40 },
  body: { padding: 16, gap: 20 },
  input: {
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
  error: { fontFamily: fonts.medium, fontSize: 12, color: colors.negative.default, marginTop: 4 },
  valueBlock: { alignItems: 'center', gap: 8 },
  valueLabel: { fontFamily: fonts.medium, fontSize: 14, color: colors.neutral[600], textTransform: 'uppercase' },
  required: { color: colors.primary.default },
  stepper: { gap: 22 },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  flex: { flex: 1 },
  delete: { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center' },
  deleteText: { fontFamily: fonts.semibold, fontSize: 16, color: colors.negative.default },
  pressed: { opacity: 0.6 },
});
