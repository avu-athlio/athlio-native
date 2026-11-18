import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { CheckCircle, X } from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProBadge } from '@/components/progress/ProgressUI';
import Button from '@/components/ui/Button';
import { useUser } from '@/context/UserContext';
import { PLANS, fetchProPlayers, proMissing, startPro, stopPro } from '@/lib/pro';
import { colors, fonts } from '@/theme';

const BENEFITS = [
  { key: 'scout', icon: require('@/assets/images/pro/benefit-scout.svg'), title: 'Scout Visibility', text: 'Get premium badge and see who viewed you' },
  { key: 'ovr', icon: require('@/assets/images/pro/benefit-ovr.svg'), title: 'Predictive OVR', text: 'AI career trajectory forecast' },
  { key: 'training', icon: require('@/assets/images/pro/benefit-training.svg'), title: 'Training support', text: 'Plan and track your trainings, get suggestions' },
  { key: 'challenges', icon: require('@/assets/images/pro/benefit-challenges.svg'), title: 'Exclusive Challenges', text: 'Pro-only challenges & rewards' },
];

/**
 * Figma "Subscription overview". Test version: there's no store payment yet,
 * so starting Pro calls start_pro() (supabase/migrations/20261118_pro.sql)
 * and goes on to the Pro onboarding.
 */
export default function ProUpgrade() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, refreshProfile } = useUser();
  const isPro = !!profile?.is_pro;
  const [plan, setPlan] = useState('annual');
  const [busy, setBusy] = useState(false);
  const [players, setPlayers] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchProPlayers()
      .then((p) => !cancelled && setPlayers(p))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const fail = (title, e) =>
    Alert.alert(title, proMissing(e) ? 'Pro isn’t set up on the server yet.' : (e?.message ?? 'Try again.'));

  const start = async () => {
    setBusy(true);
    try {
      await startPro(plan);
      await refreshProfile();
      router.replace('/pro/welcome');
    } catch (e) {
      setBusy(false);
      fail('Could not start Pro', e);
    }
  };

  const turnOff = () =>
    Alert.alert('Turn off Pro?', 'Testing only: switches your account back to the free version.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Turn off',
        style: 'destructive',
        onPress: () =>
          stopPro()
            .then(refreshProfile)
            .then(() => router.back())
            .catch((e) => fail('Could not turn off Pro', e)),
      },
    ]);

  return (
    <LinearGradient colors={['#222c94', '#070a1d']} style={styles.screen}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close"
        onPress={() => router.back()}
        style={[styles.close, { top: insets.top + 4 }]}>
        <X size={24} color={colors.white} />
      </Pressable>

      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 52 }]}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Go </Text>
          <ProBadge size={26} />
          <Text style={styles.title}> .</Text>
        </View>
        <Text style={styles.title}>Play bigger.</Text>
        <Text style={styles.sub}>Unlock every tool to accelerate your career and get noticed by scouts.</Text>

        <View style={styles.plans}>
          {['monthly', 'annual'].map((id) => {
            const p = PLANS[id];
            const on = plan === id;
            return (
              <Pressable
                key={id}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`${p.label}, ${p.price} ${p.per}${p.billed ? `, ${p.billed}` : ''}`}
                onPress={() => setPlan(id)}
                style={[styles.plan, on && styles.planOn]}>
                <View style={styles.planTop}>
                  <Text style={styles.planLabel}>{p.label}</Text>
                  {on ? <CheckCircle size={24} color={colors.white} weight="fill" /> : null}
                </View>
                <View style={styles.priceRow}>
                  <Text style={styles.price}>{p.price}</Text>
                  <Text style={styles.per}>{p.per}</Text>
                </View>
                {p.billed ? <Text style={styles.billed}>{p.billed}</Text> : null}
                {p.badge ? (
                  <View style={styles.save}>
                    <Text style={styles.saveText}>{p.badge}</Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.benefits}>
          {BENEFITS.map((b, i) => (
            <View key={b.key} style={[styles.benefit, i < BENEFITS.length - 1 && styles.benefitBorder]}>
              <View style={styles.benefitIcon}>
                <Image source={b.icon} style={styles.benefitImg} />
              </View>
              <View style={styles.benefitText}>
                <Text style={styles.benefitTitle}>{b.title}</Text>
                <Text style={styles.benefitSub}>{b.text}</Text>
              </View>
            </View>
          ))}
        </View>

        {players?.count ? (
          <View style={styles.players}>
            <View style={styles.faces}>
              {players.avatars.map((uri, i) => (
                <Image key={uri} source={{ uri }} style={[styles.face, i > 0 && styles.faceOverlap]} />
              ))}
            </View>
            <Text style={styles.playersText}>
              {players.count.toLocaleString('en-GB')} pro {players.count === 1 ? 'player' : 'players'}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {isPro ? (
          <>
            <Button size="big" label="Pro is active" disabled onPress={() => {}} />
            <Pressable accessibilityRole="button" onPress={turnOff} style={styles.off}>
              <Text style={styles.offText}>Turn off Pro (testing)</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Button size="big" label={busy ? 'Starting…' : 'Start 7-day trial'} disabled={busy} onPress={start} style={styles.cta} />
            <Text style={styles.small}>Test version · no payment is taken</Text>
          </>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  close: {
    position: 'absolute',
    right: 16,
    zIndex: 2,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(240,240,243,0.1)',
  },
  content: { paddingHorizontal: 16, paddingBottom: 24, alignItems: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  title: { fontFamily: fonts.condensedBoldItalic, fontSize: 44, lineHeight: 48, color: colors.white, textTransform: 'uppercase' },
  sub: { fontFamily: fonts.medium, fontSize: 14, color: colors.primary[300], textAlign: 'center', maxWidth: 279, marginTop: 8 },

  plans: { flexDirection: 'row', gap: 9, marginTop: 32, alignSelf: 'stretch' },
  plan: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 12,
    minHeight: 106,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  planOn: { borderColor: colors.primary.default },
  planTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planLabel: { fontFamily: fonts.semiboldItalic, fontSize: 14, lineHeight: 24, color: colors.neutral[400], textTransform: 'uppercase' },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  price: { fontFamily: fonts.condensedBoldItalic, fontSize: 44, lineHeight: 48, color: colors.neutral.bg },
  per: { fontFamily: fonts.medium, fontSize: 12, color: colors.neutral[400], marginBottom: 8 },
  billed: { fontFamily: fonts.medium, fontSize: 12, color: colors.neutral[500] },
  save: {
    position: 'absolute',
    top: -10,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 9999,
    backgroundColor: colors.warning[600],
  },
  saveText: { fontFamily: fonts.semiboldItalic, fontSize: 10, color: colors.white, textTransform: 'uppercase' },

  benefits: { alignSelf: 'stretch', marginTop: 16, borderRadius: 12, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.2)' },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  benefitBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(125,124,134,0.5)' },
  benefitIcon: { padding: 8, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.1)' },
  benefitImg: { width: 20, height: 20 },
  benefitText: { flex: 1, gap: 3 },
  benefitTitle: { fontFamily: fonts.semibold, fontSize: 16, color: colors.white },
  benefitSub: { fontFamily: fonts.medium, fontSize: 14, color: colors.neutral[500] },

  players: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24 },
  faces: { flexDirection: 'row' },
  face: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: colors.primary[950], backgroundColor: '#f0f1f4' },
  faceOverlap: { marginLeft: -20 },
  playersText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.white },

  footer: { paddingHorizontal: 16, paddingTop: 8, gap: 8 },
  cta: { boxShadow: '0 0 14px rgba(64,81,253,0.5)' },
  small: { fontFamily: fonts.medium, fontSize: 12, color: colors.neutral[700], textAlign: 'center' },
  off: { alignItems: 'center', paddingVertical: 6 },
  offText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.negative[400] },
});
