import { Image } from 'expo-image';
import { SealCheck } from 'phosphor-react-native';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme';

// Port of the web ProfilePicture (+ VerifiedBadge).
// size — "xlarge" (84) | "large" (60) | "medium" (44) | "small" (32) | "mini" (20)
const SIZES = {
  xlarge: { box: 84, badgePad: 3, badgeIcon: 14 },
  large: { box: 60, badgePad: 2.25, badgeIcon: 10 },
  medium: { box: 44, badgePad: 2.25, badgeIcon: 8 },
  small: { box: 32, badgePad: 1.5, badgeIcon: 5 },
  mini: { box: 20, badgePad: 1, badgeIcon: 4 },
};

export default function Avatar({ uri, size = 'medium', verified = false }) {
  const s = SIZES[size] ?? SIZES.medium;
  const box = { width: s.box, height: s.box, borderRadius: s.box / 2 };

  return (
    <View>
      {uri ? (
        <Image source={{ uri }} style={box} contentFit="cover" transition={150} />
      ) : (
        <View style={[box, styles.placeholder]} />
      )}
      {verified ? (
        <View style={[styles.badge, { padding: s.badgePad }]}>
          <SealCheck size={s.badgeIcon} color={colors.white} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: { backgroundColor: colors.neutral[100] },
  badge: {
    position: 'absolute',
    right: 0,
    bottom: 0.5,
    borderRadius: 999,
    backgroundColor: colors.primary.default,
  },
});
