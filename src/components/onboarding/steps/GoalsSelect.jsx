import { CheckSquare, Square } from 'phosphor-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import StepHeader from '@/components/onboarding/StepHeader';
import { colors, fonts, radius } from '@/theme';

const GOALS = [
  { id: 'discovered', label: 'Get discovered by scouts and clubs', count: 84200 },
  { id: 'new-club', label: 'Find a new club or trial opportunity', count: 31700 },
  { id: 'higher-level', label: 'Move to a higher level of football', count: 9400 },
  { id: 'track', label: 'Track my progress', count: 62100 },
  { id: 'build-profile', label: 'Build my football profile', count: 14800 },
  { id: 'showcase', label: 'Showcase my highlights', count: 8300 },
];

const formatCount = (n) => (n > 10000 ? '10,000+' : n.toLocaleString('en-US'));

// Stored as a JSON array string, same as the web app.
function parseGoals(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function GoalsSelect({ value, onChange }) {
  const selected = useMemo(() => parseGoals(value), [value]);
  const total = GOALS.filter((g) => selected.includes(g.id)).reduce((sum, g) => sum + g.count, 0);

  function toggle(id) {
    const next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
    onChange(JSON.stringify(next));
  }

  return (
    <View>
      <StepHeader
        title="Your Goals"
        subtitle="What are you looking to achieve? This will help personalise your experience."
      />

      <View style={styles.badgeWrap}>
        <Text style={styles.badge}>
          {selected.length === 0 ? '0 people in common' : `${formatCount(total)} people in common`}
        </Text>
      </View>

      <View style={styles.list}>
        {GOALS.map((g) => {
          const active = selected.includes(g.id);
          return (
            <Pressable
              key={g.id}
              onPress={() => toggle(g.id)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: active }}
              style={({ pressed }) => [styles.item, active && styles.itemSelected, pressed && styles.pressed]}>
              <Text style={styles.itemLabel}>{g.label}</Text>
              {active ? (
                <CheckSquare size={24} weight="fill" color={colors.primary.default} />
              ) : (
                <Square size={24} color={colors.neutral[500]} />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badgeWrap: { alignItems: 'center', marginBottom: 20 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: colors.primary[100],
    fontFamily: fonts.semiboldItalic,
    fontSize: 14,
    textTransform: 'uppercase',
    color: colors.primary[800],
  },
  list: { gap: 8 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    backgroundColor: colors.white,
  },
  itemSelected: { borderColor: colors.primary.default, backgroundColor: colors.primary[50] },
  pressed: { opacity: 0.85 },
  itemLabel: { flex: 1, fontFamily: fonts.medium, fontSize: 16, color: colors.black },
});
