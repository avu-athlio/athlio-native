import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import StepHeader from '@/components/onboarding/StepHeader';
import Button from '@/components/ui/Button';
import { colors, fonts } from '@/theme';

const COPY = {
  athlete: {
    bg: require('@/assets/images/premium-screen-bg.png'),
    title: 'Unlock your features',
    text: 'Get AI insights, advanced analytics, and full scout visibility. Take your career to the next level.',
  },
  professional: {
    bg: require('@/assets/images/PremiumScreen-scout.png'),
    title: 'Unlock pro features',
    text: 'Search players, build your watchlist, and discover talent with advanced scouting tools.',
  },
};

/**
 * Last wizard step. Both buttons finish onboarding; the upgrade/scouting
 * screens arrive in later phases, so for now "Get Premium" also lands on Home.
 */
export default function Premium({ professional = false, onFinish, busy = false, bottomInset = 0 }) {
  const copy = professional ? COPY.professional : COPY.athlete;

  return (
    <View style={styles.root}>
      <Image source={copy.bg} style={[StyleSheet.absoluteFill, styles.bg]} contentFit="cover" contentPosition="top" />
      <LinearGradient
        colors={['rgba(246,246,247,0)', colors.neutral.bg]}
        locations={[0.35, 0.72]}
        style={StyleSheet.absoluteFill}
      />

      <StepHeader title="Level up your game" />

      <View style={[styles.paywall, { marginBottom: bottomInset + 16 }]}>
        <LinearGradient
          colors={['#222f8d', '#1f2cb4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={['#33f578', '#e7fc6f']}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={styles.badge}>
          <Text style={styles.badgeText}>PRO</Text>
        </LinearGradient>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.text}>{copy.text}</Text>
        <Button label="Get Premium features" fullWidth onPress={onFinish} disabled={busy} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'space-between' },
  bg: { top: -20 },
  paywall: {
    borderRadius: 24,
    overflow: 'hidden',
    paddingVertical: 20,
    paddingHorizontal: 16,
    gap: 16,
    alignItems: 'center',
  },
  badge: {
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.white,
    paddingHorizontal: 12,
    paddingTop: 2,
    paddingBottom: 4,
  },
  badgeText: {
    fontFamily: fonts.condensedBoldItalic,
    fontSize: 24,
    lineHeight: 26,
    textTransform: 'uppercase',
    color: colors.black,
  },
  title: {
    fontFamily: fonts.condensedBoldItalic,
    fontSize: 32,
    textTransform: 'uppercase',
    textAlign: 'center',
    color: colors.white,
  },
  text: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.85)',
  },
});
