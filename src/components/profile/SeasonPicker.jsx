import { CaretDown } from 'phosphor-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { seasonLabel } from '@/lib/profile-format';
import { colors, fonts } from '@/theme';

// Port of the web season Accordion on the Matches tab: a chip that opens a
// list of seasons. `seasons` are start years, newest first; 'all' = every season.
export default function SeasonPicker({ seasons, value, onChange }) {
  const [open, setOpen] = useState(false);
  const options = ['all', ...seasons];
  const label = (s) => (s === 'all' ? 'All Seasons' : seasonLabel(s));

  return (
    <View style={styles.root}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((v) => !v)}
        style={styles.chip}>
        <Text style={styles.chipText}>Season {label(value)}</Text>
        <CaretDown size={14} color={colors.primary.default} style={open ? styles.flipped : undefined} />
      </Pressable>

      {open ? (
        <View style={styles.menu}>
          {options.map((s) => (
            <Pressable
              key={s}
              accessibilityRole="button"
              accessibilityState={{ selected: s === value }}
              onPress={() => {
                onChange(s);
                setOpen(false);
              }}
              style={({ pressed }) => [styles.option, (pressed || s === value) && styles.optionActive]}>
              <Text style={styles.optionText}>{label(s)}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignSelf: 'flex-start', gap: 4, minWidth: 160 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.neutral[300],
  },
  chipText: { fontFamily: fonts.medium, fontSize: 14, color: colors.primary.default },
  flipped: { transform: [{ rotate: '180deg' }] },
  menu: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    backgroundColor: colors.neutral.bg,
  },
  option: { paddingVertical: 6, paddingHorizontal: 8, borderRadius: 4 },
  optionActive: { backgroundColor: colors.neutral[300] },
  optionText: { fontFamily: fonts.regular, fontSize: 14, color: colors.black },
});
