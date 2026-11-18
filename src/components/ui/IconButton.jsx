import { Pressable, StyleSheet } from 'react-native';

import { colors } from '@/theme';

/**
 * Ported from the web IconButton.
 * size — "large" | "medium" | "small"
 * type — "primary" | "neutral" | "subtle"
 * icon — phosphor-react-native component (`weight` is passed through, e.g. "fill")
 */
export default function IconButton({
  size = 'medium',
  type = 'subtle',
  icon: Icon,
  onPress,
  color,
  weight,
  disabled = false,
  accessibilityLabel,
  style,
}) {
  const s = SIZES[size] ?? SIZES.medium;
  const v = VARIANTS[type] ?? VARIANTS.subtle;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      style={({ pressed }) => [
        styles.base,
        { padding: s.padding },
        v.container,
        disabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}>
      {Icon ? <Icon size={s.icon} color={color ?? v.color} weight={weight} /> : null}
    </Pressable>
  );
}

const SIZES = {
  large: { padding: 4, icon: 32 },
  medium: { padding: 12, icon: 24 },
  small: { padding: 8, icon: 20 },
};

const VARIANTS = {
  primary: { container: { backgroundColor: colors.primary.default }, color: colors.white },
  neutral: {
    container: {
      backgroundColor: colors.neutral[100],
      borderWidth: 2,
      borderColor: colors.neutral[300],
    },
    color: colors.black,
  },
  subtle: { container: { backgroundColor: 'transparent' }, color: colors.black },
};

const styles = StyleSheet.create({
  base: { borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.6 },
});
