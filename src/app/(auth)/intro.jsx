import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '@/components/ui/Button';
import { markIntroSeen } from '@/lib/intro';
import { colors, fonts, type } from '@/theme';

const hero = require('@/assets/images/preboarding-hero.jpg');
const logo = require('@/assets/logos/main-logo-small.svg');

export default function Intro() {
  function go(mode) {
    markIntroSeen();
    router.push({ pathname: '/auth', params: { mode } });
  }

  return (
    <View style={styles.root}>
      <Image source={hero} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition="top" />
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.88)', 'rgba(0,0,0,0.96)']}
        locations={[0, 0.65, 1]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView edges={['bottom']} style={styles.bottom}>
        <View style={styles.content}>
          <View style={styles.logoBox}>
            <Image source={logo} style={styles.logo} contentFit="contain" />
          </View>

          <Text style={[type['heading-6xl-italic'], styles.headline]}>
            Expand your{'\n'}network
          </Text>

          <View style={styles.actions}>
            <Button type="secondary" label="Log in" onPress={() => go('login')} style={styles.flex} />
            <Button
              type="primary"
              label="Create account"
              onPress={() => go('signup')}
              style={styles.flex}
            />
          </View>
        </View>

        <Text style={styles.legal}>
          By continuing, you agree to Athlio&apos;s <Text style={styles.link}>Terms of Use</Text>.
        </Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.black },
  bottom: { width: '100%' },
  content: { gap: 20, paddingHorizontal: 16, paddingBottom: 20 },
  logoBox: {
    width: 53,
    height: 53,
    borderRadius: 12,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 34, height: 34 },
  headline: { color: colors.white },
  actions: { flexDirection: 'row', gap: 12 },
  flex: { flex: 1 },
  legal: {
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 24,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    color: colors.neutral[700],
  },
  link: { textDecorationLine: 'underline' },
});
