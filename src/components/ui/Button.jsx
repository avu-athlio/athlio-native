import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, fonts, radius } from '@/theme';

/**
 * Ported from the web Button.
 * size  — "big" (44, full width) | "medium" (44) | "small" (36) | "xsmall" (32)
 * type  — "primary" | "outlined" | "secondary" | "subtle" | "gray" | "white"
 * leadingIcon / trailingIcon — phosphor-react-native component
 */
export default function Button({
  size = 'medium',
  type = 'primary',
  label,
  onPress,
  leadingIcon: LeadingIcon,
  trailingIcon: TrailingIcon,
  fullWidth = false,
  disabled = false,
  style,
}) {
  const sizeStyle = SIZES[size] ?? SIZES.medium;
  const variant = VARIANTS[type] ?? VARIANTS.primary;
  const iconSize = ICON_SIZES[size] ?? 24;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        sizeStyle.container,
        variant.container,
        (fullWidth || size === 'big') && styles.fullWidth,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}>
      {LeadingIcon ? <LeadingIcon size={iconSize} color={variant.text.color} /> : null}
      <Text numberOfLines={1} style={[styles.label, sizeStyle.text, variant.text]}>
        {label}
      </Text>
      {TrailingIcon ? <TrailingIcon size={iconSize} color={variant.text.color} /> : null}
    </Pressable>
  );
}

const ICON_SIZES = { big: 24, medium: 24, small: 20, xsmall: 18 };

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: radius.sm,
  },
  fullWidth: { alignSelf: 'stretch' },
  disabled: { opacity: 0.3 },
  pressed: { opacity: 0.8 },
  label: { fontFamily: fonts.semibold },
});

const SIZES = {
  big: { container: { height: 44, paddingHorizontal: 16 }, text: { fontSize: 16 } },
  medium: { container: { height: 44, paddingHorizontal: 16 }, text: { fontSize: 16 } },
  small: { container: { height: 36, paddingHorizontal: 12 }, text: { fontSize: 16 } },
  xsmall: { container: { height: 32, paddingHorizontal: 8 }, text: { fontSize: 14 } },
};

const VARIANTS = {
  primary: {
    container: { backgroundColor: colors.primary.default },
    text: { color: colors.white },
  },
  outlined: {
    container: { backgroundColor: 'transparent', borderWidth: 2, borderColor: colors.neutral[200] },
    text: { color: colors.black },
  },
  secondary: {
    container: {
      backgroundColor: colors.neutral[100],
      borderWidth: 1,
      borderColor: colors.neutral[200],
    },
    text: { color: colors.primary[700] },
  },
  subtle: {
    container: { backgroundColor: 'transparent' },
    text: { color: colors.primary.default },
  },
  gray: {
    container: { backgroundColor: colors.neutral[100] },
    text: { color: colors.black },
  },
  white: {
    container: { backgroundColor: 'rgba(255,255,255,0.2)' },
    text: { color: colors.white },
  },
};
VARIANTS.outline = VARIANTS.outlined;
