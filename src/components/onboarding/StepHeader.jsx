import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, type } from '@/theme';

// Big condensed title + muted subtitle used at the top of every wizard step.
export default function StepHeader({ title, subtitle, light = false, subtitleColor, style }) {
  return (
    <View style={[styles.header, style]}>
      <Text style={[type['heading-5xl-italic'], styles.title, light && styles.light]}>{title}</Text>
      {subtitle ? (
        <Text
          style={[
            styles.subtitle,
            light && styles.subtitleLight,
            subtitleColor && { color: subtitleColor },
          ]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: 4, marginBottom: 20 },
  title: { color: colors.black },
  light: { color: colors.white },
  subtitle: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 22, color: colors.muted },
  subtitleLight: { color: colors.white },
});
