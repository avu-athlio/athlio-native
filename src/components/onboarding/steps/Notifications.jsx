import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeOut, LinearTransition, SlideInDown } from 'react-native-reanimated';

import StepHeader from '@/components/onboarding/StepHeader';
import { colors, fonts, radius } from '@/theme';

const phoneBg = require('@/assets/images/footballrun.png');

const NOTIFICATIONS = [
  { name: 'Magui Sainz', role: 'Scout', msg: 'Hi! We invite you to go for a trial in FC Barcelona?', avatar: require('@/assets/images/notif-avatar-1.jpg') },
  { name: 'José Mourinho', role: 'Coach', msg: 'Are you ready to invest in your future?', avatar: require('@/assets/images/notif-avatar-2.jpg') },
  { name: 'Pep Guardiola', role: 'Coach', msg: "I'd love to have you train with us next season.", initials: 'PG', color: '#2563eb' },
  { name: 'Real Madrid CF', role: 'Club', msg: 'Your profile has been added to our watchlist.', initials: 'RM', color: '#d4af37' },
  { name: 'Marco Ferrari', role: 'Scout', msg: "Watched your highlights — let's talk opportunities.", initials: 'MF', color: '#16a34a' },
  { name: 'Ajax Academy', role: 'Club', msg: 'Applications for our trial camp are now open.', initials: 'AJ', color: '#dc2626' },
];

const HOLD_MS = 4000;

function NotifCard({ card, small }) {
  return (
    <View style={[styles.card, small && styles.cardSmall]}>
      {card.avatar ? (
        <Image source={card.avatar} style={styles.avatar} contentFit="cover" />
      ) : (
        <View style={[styles.avatar, styles.initials, { backgroundColor: card.color }]}>
          <Text style={styles.initialsText}>{card.initials}</Text>
        </View>
      )}
      <View style={styles.cardBody}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {card.name}
          </Text>
          <Text style={styles.roleBadge}>{card.role}</Text>
        </View>
        <Text style={styles.msg} numberOfLines={2}>
          {card.msg}
        </Text>
      </View>
    </View>
  );
}

// Teaser for the notification permission prompt: a phone mock-up with a
// ticker of example notifications. The prompt itself is the bottom-bar button.
export default function Notifications() {
  const next = useRef(2);
  const [cards, setCards] = useState(() => [
    { id: 0, notif: NOTIFICATIONS[0] },
    { id: 1, notif: NOTIFICATIONS[1] },
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      const id = next.current++;
      setCards((prev) => [...prev.slice(1), { id, notif: NOTIFICATIONS[id % NOTIFICATIONS.length] }]);
    }, HOLD_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.root}>
      <StepHeader
        title="Keep track on the best prospects"
        subtitle="Turn on notifications to get the most out of the app"
      />

      <View style={styles.visual} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={styles.phone}>
          <Image source={phoneBg} style={StyleSheet.absoluteFill} contentFit="cover" />
          <View style={styles.phoneDim} />
          <Text style={styles.time}>6:07</Text>
        </View>

        <View style={styles.cards}>
          {cards.map((c, i) => (
            <Animated.View
              key={c.id}
              entering={SlideInDown.duration(800)}
              exiting={FadeOut.duration(500)}
              layout={LinearTransition.duration(800)}>
              <NotifCard card={c.notif} small={i > 0} />
            </Animated.View>
          ))}
        </View>

        <LinearGradient
          colors={['rgba(246,246,247,0)', colors.neutral.bg]}
          style={styles.fade}
          pointerEvents="none"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  visual: { flex: 1, alignItems: 'center', overflow: 'hidden', marginTop: 8 },
  phone: {
    width: 260,
    height: 460,
    borderRadius: 40,
    borderWidth: 8,
    borderColor: colors.black,
    overflow: 'hidden',
    alignItems: 'center',
  },
  phoneDim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  time: {
    marginTop: 48,
    fontFamily: fonts.condensedBold,
    fontSize: 64,
    color: colors.white,
  },
  cards: { position: 'absolute', top: 170, left: 16, right: 16, gap: 8, alignItems: 'center' },
  card: {
    width: '100%',
    maxWidth: 340,
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.92)',
    boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
  },
  cardSmall: { transform: [{ scale: 0.86 }] },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  initials: { alignItems: 'center', justifyContent: 'center' },
  initialsText: { fontFamily: fonts.bold, fontSize: 14, color: colors.white },
  cardBody: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { flexShrink: 1, fontFamily: fonts.semibold, fontSize: 14, color: colors.black },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: colors.primary[100],
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.primary[800],
  },
  msg: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 17, color: colors.neutral[900] },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 120 },
});
