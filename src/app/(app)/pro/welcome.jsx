import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PRO_GRADIENT } from '@/components/progress/ProgressUI';
import { colors, fonts } from '@/theme';

/** Figma "Welcoming screen": green PRO splash, then the Pro onboarding. */
export default function ProWelcome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const t = setTimeout(() => router.replace('/pro/onboarding'), 1600);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <LinearGradient colors={PRO_GRADIENT} start={{ x: 0, y: 0.6 }} end={{ x: 1, y: 0.4 }} style={styles.screen}>
      <Text style={styles.pro} accessibilityRole="header">
        PRO
      </Text>
      <Text style={[styles.note, { bottom: Math.max(insets.bottom, 16) + 8 }]} accessibilityLiveRegion="polite">
        Setting up your Pro experience…
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pro: { fontFamily: fonts.condensedBoldItalic, fontSize: 64, lineHeight: 70, color: colors.black },
  note: { position: 'absolute', fontFamily: fonts.medium, fontSize: 14, color: colors.black },
});
