import { Info, Minus, Plus, Question } from 'phosphor-react-native';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { CARD_SHADOW, MUTED } from '@/components/progress/ProgressUI';
import { colors, fonts } from '@/theme';

// Figma order (Profile of player): two columns, three rows.
export const SKILL_FORM = [
  { key: 'dribbling', label: 'Dribbling', help: 'Beating players with the ball at your feet.' },
  { key: 'passing', label: 'Passing', help: 'Accuracy and range of your passes.' },
  { key: 'shot_power', label: 'Shot power', help: 'How hard and clean you strike the ball.' },
  { key: 'ball_control', label: 'Ball control', help: 'First touch and keeping the ball close.' },
  { key: 'tackling', label: 'Tackling', help: 'Winning the ball back cleanly.' },
  { key: 'anticipation', label: 'Anticipation', help: 'Reading the game before it happens.' },
];

export const DEFAULT_SKILLS = Object.fromEntries(SKILL_FORM.map((s) => [s.key, 5]));

function SkillCard({ skill, value, onChange }) {
  const step = (d) => onChange(Math.max(1, Math.min(10, value + d)));
  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`What is ${skill.label}?`}
        hitSlop={8}
        onPress={() => Alert.alert(skill.label, skill.help)}
        style={styles.help}>
        <Question size={20} color={colors.neutral[500]} />
      </Pressable>
      <Text style={styles.label}>{skill.label}</Text>
      <View
        style={styles.stepper}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={skill.label}
        accessibilityValue={{ min: 1, max: 10, now: value }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => step(e.nativeEvent.actionName === 'increment' ? 1 : -1)}>
        <Pressable onPress={() => step(-1)} disabled={value <= 1} hitSlop={10} importantForAccessibility="no">
          <Minus size={22} color={value <= 1 ? colors.neutral[300] : colors.primary.default} />
        </Pressable>
        <Text style={styles.value}>{value}</Text>
        <Pressable onPress={() => step(1)} disabled={value >= 10} hitSlop={10} importantForAccessibility="no">
          <Plus size={22} color={value >= 10 ? colors.neutral[300] : colors.primary.default} />
        </Pressable>
      </View>
    </View>
  );
}

/**
 * Figma "Profile of player": rate six football skills 1–10. Used on its own
 * (Progress → Skill trends) and meant for step 2 of the Pro onboarding.
 */
export default function SkillsForm({ values, onChange }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.titleBlock}>
        <Text style={styles.title} accessibilityRole="header">
          Profile of player
        </Text>
        <Text style={styles.sub}>Rate your football abilities honestly</Text>
        <View style={styles.note}>
          <Info size={14} color={MUTED} />
          <Text style={styles.noteText}>This helps personalize your training suggestions</Text>
        </View>
      </View>
      <View style={styles.grid}>
        {SKILL_FORM.map((s) => (
          <SkillCard key={s.key} skill={s} value={values[s.key]} onChange={(v) => onChange({ ...values, [s.key]: v })} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 20 },
  titleBlock: { gap: 4, alignItems: 'flex-start' },
  title: { fontFamily: fonts.condensedBoldItalic, fontSize: 44, lineHeight: 48, color: colors.black, textTransform: 'uppercase' },
  sub: { fontFamily: fonts.medium, fontSize: 16, color: MUTED },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.neutral[100],
  },
  noteText: { fontFamily: fonts.medium, fontSize: 12, color: colors.neutral[800] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 8 },
  card: {
    width: '49%',
    alignItems: 'center',
    gap: 16,
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.white,
    ...CARD_SHADOW,
  },
  help: { position: 'absolute', top: 6, right: 6 },
  label: { fontFamily: fonts.semibold, fontSize: 14, color: colors.black, textTransform: 'uppercase' },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 22,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  value: { minWidth: 28, textAlign: 'center', fontFamily: fonts.condensedBold, fontSize: 40, color: colors.black },
});
