import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/theme';

// Port of the web Badge ("light" and "dark" colors, xs / sm sizes).
export default function Badge({ text = '', color = 'light', size = 'xs' }) {
  const c = COLORS[color] ?? COLORS.light;
  const s = SIZES[size] ?? SIZES.xs;

  return (
    <View style={[styles.badge, { backgroundColor: c.bg, height: s.height }]}>
      <Text style={[styles.text, { color: c.text, fontSize: s.fontSize }]}>{String(text).toUpperCase()}</Text>
    </View>
  );
}

const COLORS = {
  light: { bg: colors.primary[100], text: colors.primary[800] },
  dark: { bg: colors.primary[950], text: colors.primary[200] },
};

const SIZES = {
  xs: { height: 16, fontSize: 12 },
  sm: { height: 21, fontSize: 14 },
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  text: { fontFamily: fonts.semiboldItalic, lineHeight: 15 },
});
