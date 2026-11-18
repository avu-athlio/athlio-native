import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { X } from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MUTED, ProBadge } from '@/components/progress/ProgressUI';
import { colors, fonts } from '@/theme';

// Figma frames of the three light stripes (SVG bounds include the soft edges).
const STRIPES = [
  { src: require('@/assets/images/pro/ready-stripe-1.svg'), left: -246, top: 42, width: 799, height: 840 },
  { src: require('@/assets/images/pro/ready-stripe-2.svg'), left: -120, top: 33, width: 714, height: 756 },
  { src: require('@/assets/images/pro/ready-stripe-3.svg'), left: 104, top: -64, width: 674, height: 681 },
];

/**
 * Figma "Onboarding to pro - 4". The stripes drift slowly ("animated
 * background, shining while moving"), unless Reduce Motion is on.
 */
export default function ProReady() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [drift] = useState(() => new Animated.Value(0));

  useEffect(() => {
    let loop;
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (reduce) return;
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(drift, { toValue: 1, duration: 3500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(drift, { toValue: 0, duration: 3500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      );
      loop.start();
    });
    return () => loop?.stop();
  }, [drift]);

  const move = { transform: [{ translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [-20, 20] }) }, { translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [-14, 14] }) }] };

  return (
    <View style={styles.screen}>
      <Animated.View style={[StyleSheet.absoluteFill, move]} pointerEvents="none">
        {STRIPES.map(({ src, ...frame }, i) => (
          <Image key={i} source={src} style={[styles.stripe, frame]} contentFit="fill" />
        ))}
      </Animated.View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close"
        onPress={() => router.back()}
        style={[styles.close, { top: insets.top + 4 }]}>
        <X size={24} color={colors.black} />
      </Pressable>

      <View style={styles.center}>
        <Text style={styles.title} accessibilityRole="header">
          You’re ready to
        </Text>
        <View style={styles.row}>
          <Text style={styles.title}>go </Text>
          <ProBadge size={36} />
        </View>
      </View>

      <Text style={[styles.note, { bottom: Math.max(insets.bottom, 16) + 8 }]}>
        Your personalized system is ready based on your schedule, skills and connected apps
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.neutral.bg, overflow: 'hidden' },
  stripe: { position: 'absolute' },
  close: {
    position: 'absolute',
    right: 16,
    zIndex: 2,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(240,240,243,0.6)',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center' },
  title: { fontFamily: fonts.condensedBoldItalic, fontSize: 44, lineHeight: 48, color: colors.black, textTransform: 'uppercase', textAlign: 'center' },
  note: { position: 'absolute', left: 40, right: 40, fontFamily: fonts.medium, fontSize: 16, color: MUTED, textAlign: 'center' },
});
