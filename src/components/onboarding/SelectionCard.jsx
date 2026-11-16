import { Image } from 'expo-image';
import { isValidElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius } from '@/theme';

/**
 * Selectable card (radio by default, checkbox with multi). Ported from the web SelectionCard.
 * icon — phosphor-react-native component, image source, or a rendered element.
 */
export default function SelectionCard({
  name,
  description,
  icon,
  value,
  checked = false,
  onChange,
  multi = false,
  style,
}) {
  const selectable = typeof onChange === 'function' && value !== undefined;

  let iconNode = null;
  if (isValidElement(icon)) {
    iconNode = icon;
  } else if (typeof icon === 'number' || icon?.uri) {
    // require('...') asset or { uri }
    iconNode = <Image source={icon} style={styles.iconImage} contentFit="contain" />;
  } else if (icon) {
    const Icon = icon;
    iconNode = <Icon size={22} weight="bold" color={colors.primary.default} />;
  }

  return (
    <Pressable
      disabled={!selectable}
      onPress={() => onChange?.(value)}
      accessibilityRole={selectable ? (multi ? 'checkbox' : 'radio') : undefined}
      accessibilityState={selectable ? { checked } : undefined}
      style={({ pressed }) => [styles.card, checked && styles.selected, pressed && styles.pressed, style]}>
      <View style={styles.icon}>{iconNode}</View>
      <View style={styles.body}>
        <Text style={styles.title}>{name}</Text>
        {description ? <Text style={styles.desc}>{description}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 164,
    paddingTop: 32,
    paddingRight: 16,
    paddingBottom: 16,
    paddingLeft: 12,
    justifyContent: 'center',
    gap: 4,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.neutral[100],
    backgroundColor: colors.white,
  },
  selected: { borderColor: colors.primary.default },
  pressed: { opacity: 0.85 },
  icon: { width: 36, height: 36, padding: 8, alignItems: 'center', justifyContent: 'center' },
  iconImage: { width: 20, height: 20 },
  body: { gap: 8 },
  title: { fontFamily: fonts.medium, fontSize: 16, color: colors.black },
  desc: { fontFamily: fonts.medium, fontSize: 12, color: colors.neutral[700] },
});
