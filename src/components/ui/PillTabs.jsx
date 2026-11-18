import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/theme';

// Port of the web NavigationTabs "pill" variant.
// tabs — { id, label }[]
export default function PillTabs({ tabs, activeTab, onTabChange, style }) {
  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.pill} accessibilityRole="tablist">
        {tabs.map(({ id, label }) => {
          const active = id === activeTab;
          return (
            <Pressable
              key={id}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => onTabChange(id)}
              style={[styles.tab, active && styles.tabActive]}>
              <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: 12, paddingHorizontal: 16 },
  pill: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderRadius: 999,
    backgroundColor: colors.neutral[100],
  },
  tab: { flex: 1, height: 32, borderRadius: 100, alignItems: 'center', justifyContent: 'center' },
  tabActive: { backgroundColor: 'rgba(255,255,255,0.9)' },
  label: {
    fontFamily: fonts.condensedBoldItalic,
    fontSize: 14,
    letterSpacing: 0.14,
    textTransform: 'uppercase',
    color: colors.neutral[500],
  },
  labelActive: { color: colors.black },
});
