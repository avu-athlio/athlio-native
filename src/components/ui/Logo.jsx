import { LocalSvg } from 'react-native-svg/css';
import { View } from 'react-native';

import { colors } from '@/theme';

// The logo files use fill="currentColor", so they take whatever `color` is
// passed (expo-image can't do that, so they're drawn with react-native-svg).
const LOGOS = {
  main: { asset: require('@/assets/logos/main-logo.svg'), ratio: 2127 / 481, color: colors.black },
  // Rounded tile with a white mark; `color` sets the tile.
  small: { asset: require('@/assets/logos/main-logo-small.svg'), ratio: 1, color: colors.primary[950] },
};

/**
 * Athlio logo. variant "main" (wordmark, dark by default) or "small" (navy
 * tile with the white mark; `color` changes the tile). Give a `height`; the width follows the logo's shape.
 */
export default function Logo({ variant = 'main', height, color, style, accessibilityLabel = 'Athlio' }) {
  const logo = LOGOS[variant] ?? LOGOS.main;
  const width = height * logo.ratio;
  return (
    <View style={[{ width, height }, style]} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
      <LocalSvg asset={logo.asset} width={width} height={height} color={color ?? logo.color} />
    </View>
  );
}
