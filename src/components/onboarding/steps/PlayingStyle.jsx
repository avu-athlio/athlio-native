import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import StepHeader from '@/components/onboarding/StepHeader';
import { colors, fonts } from '@/theme';

const CARD_W = 290;
const CARD_H = 380;
const GAP = 16;
const SNAP = CARD_W + GAP;

const img = {
  courtois: require('@/assets/images/playing-styles/player-courtois.jpg'),
  neuer: require('@/assets/images/playing-styles/player-neuer.jpg'),
  ibrahimovic: require('@/assets/images/playing-styles/ibrahimovic.png'),
  firmino: require('@/assets/images/playing-styles/Firmino.png'),
  silva: require('@/assets/images/playing-styles/Silva.png'),
  salah: require('@/assets/images/playing-styles/Salah.png'),
  rashford: require('@/assets/images/playing-styles/rashford.webp'),
  debruyne: require('@/assets/images/playing-styles/debruyne.webp'),
  dybala: require('@/assets/images/playing-styles/dybala.png'),
  kimmich: require('@/assets/images/playing-styles/joshua_kimmich.avif'),
  xavi: require('@/assets/images/playing-styles/xavi.jpg'),
  kante: require('@/assets/images/playing-styles/kante.webp'),
  mata: require('@/assets/images/playing-styles/Juan Mata.webp'),
  zaha: require('@/assets/images/playing-styles/Zaha.png'),
  robertson: require('@/assets/images/playing-styles/Robertson.webp'),
  trent: require('@/assets/images/playing-styles/Trent.png'),
  gusto: require('@/assets/images/playing-styles/Gusto.webp'),
  dias: require('@/assets/images/playing-styles/Dias.webp'),
  dijk: require('@/assets/images/playing-styles/Dijk.webp'),
  hummels: require('@/assets/images/playing-styles/hummels.webp'),
};

const ALL_STYLES = [
  { id: 'shot-stopper', label: 'Shot-stopper', positions: ['gk'], playerName: 'Thibaut Courtois', image: img.courtois, description: 'You play on the line and build your game around reflexes, positioning, and keeping the ball out above everything else.' },
  { id: 'sweeper-keeper', label: 'Sweeper-keeper', positions: ['gk'], playerName: 'Manuel Neuer', image: img.neuer, description: 'You rush off the line early, are comfortable with the ball at your feet, and act as an extra outfield player behind the defence.' },
  { id: 'target-man', label: 'Target man', positions: ['st'], playerName: 'Zlatan Ibrahimović', image: img.ibrahimovic, description: 'You hold the ball up, win aerial duels, and bring teammates into play. Physical presence is your most dangerous weapon.' },
  { id: 'false-nine', label: 'False 9', positions: ['st'], playerName: 'Roberto Firmino', image: img.firmino, description: 'You drop deep to receive, link play between midfield and attack, and create space for others to run into.' },
  { id: 'creative-wide-player', label: 'Creative wide player', positions: ['lw', 'rw'], playerName: 'Bernardo Silva', image: img.silva, description: 'You drop deeper to receive, combine quickly, and unlock defences with passing rather than direct running.' },
  { id: 'inverted-winger', label: 'Inverted winger', positions: ['lw', 'rw'], playerName: 'Mohamed Salah', image: img.salah, description: 'You start wide and cut inside onto your stronger foot, always looking to shoot or play through balls centrally.' },
  { id: 'traditional-winger', label: 'Traditional winger', positions: ['lw', 'rw'], playerName: 'Marcus Rashford', image: img.rashford, description: 'You hug the line and deliver pinpoint crosses from the byline. Pure wingers with pace and the ability to beat defenders one-on-one.' },
  { id: 'playmaker', label: 'Playmaker', positions: ['cam'], playerName: 'Kevin De Bruyne', image: img.debruyne, description: "Key passes, through balls, and assists are your currency. You unlock defences with vision others simply don't possess." },
  { id: 'shadow-striker', label: 'Shadow striker', positions: ['cam'], playerName: 'Paulo Dybala', image: img.dybala, description: 'You drift between the lines, making late runs into the box and finishing chances. Creativity meets goal-scoring threat.' },
  { id: 'box-to-box', label: 'Box to box', positions: ['cdm'], playerName: 'Joshua Kimmich', image: img.kimmich, description: "You cover every blade of grass. Defensively solid and dangerous going forward — you're everywhere on the pitch." },
  { id: 'progressive-passer', label: 'Progressive passer', positions: ['cdm'], playerName: 'Xavi Hernández', image: img.xavi, description: 'You advance play from deep with accurate, incisive passing. Building attacks from the back is your primary role.' },
  { id: 'ball-winner-cdm', label: 'Ball winner', positions: ['cdm'], playerName: "N'Golo Kanté", image: img.kante, description: 'Tackles, interceptions, and tireless pressing define you. You suffocate opponents and win the ball back repeatedly.' },
  { id: 'creative-wide-midfielder', label: 'Creative wide midfielder', positions: ['lm', 'rm'], playerName: 'Juan Mata', image: img.mata, description: 'You operate from the wing with creativity and technical prowess, creating chances and controlling the rhythm of play.' },
  { id: 'direct-wide-player', label: 'Direct wide player', positions: ['lm', 'rm'], playerName: 'Wilfried Zaha', image: img.zaha, description: 'Pace and directness are your calling cards. You take on defenders and create chaos in the opposition penalty box.' },
  { id: 'attacking-fullback', label: 'Attacking fullback', positions: ['lb', 'rb'], playerName: 'Andrew Robertson', image: img.robertson, description: 'You bomb forward to support attacks and deliver crosses. Offensive contribution is as important as defensive solidity.' },
  { id: 'inverted-fullback', label: 'Inverted fullback', positions: ['lb', 'rb'], playerName: 'Trent Alexander-Arnold', image: img.trent, description: "You cut inside onto your strong foot to create from deep positions. You're as comfortable playing in midfield as in defence." },
  { id: 'defensive-fullback', label: 'Defensive fullback', positions: ['lb', 'rb'], playerName: 'Malo Gusto', image: img.gusto, description: 'You focus on defensive discipline and one-on-one battles. Responsibility and solidity define your defensive approach.' },
  { id: 'ball-playing-defender', label: 'Ball-playing defender', positions: ['cb'], playerName: 'Rúben Dias', image: img.dias, description: "You're comfortable with the ball at your feet. You start attacks from the back with composure and confident distribution." },
  { id: 'aggressive-defender', label: 'Aggressive defender', positions: ['cb'], playerName: 'Virgil van Dijk', image: img.dijk, description: 'Tackles, interceptions, and physicality define you. You win duels and put opponents under constant pressure throughout the game.' },
  { id: 'defensive-organiser', label: 'Defensive organiser', positions: ['cb'], playerName: 'Mats Hummels', image: img.hummels, description: 'Your leadership and positioning are unmatched. You organize the defence, read the game, and make crucial interceptions.' },
];

function stylesFor(positions) {
  if (!Array.isArray(positions) || positions.length === 0) return ALL_STYLES;
  const filtered = ALL_STYLES.filter((s) => s.positions.some((p) => positions.includes(p)));
  return filtered.length > 0 ? filtered : ALL_STYLES;
}

export default function PlayingStyle({ value, onChange, positions }) {
  const { width } = useWindowDimensions();
  const list = useMemo(() => stylesFor(positions), [positions]);
  const scrollRef = useRef(null);
  // The selected style is the source of truth; unknown/empty falls back to the first card.
  const active = Math.max(0, list.findIndex((s) => s.id === value));

  // Pre-select (first style, or the saved one) so Continue is always enabled,
  // and start the carousel on that card.
  useEffect(() => {
    if (list[active].id !== value) onChange(list[active].id);
    if (active > 0) {
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ x: active * SNAP, animated: false }));
    }
    // Only when the list of styles changes (positions changed).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list]);

  function onScroll(e) {
    const i = Math.max(0, Math.min(list.length - 1, Math.round(e.nativeEvent.contentOffset.x / SNAP)));
    if (i !== active) {
      onChange(list[i].id);
      Haptics.selectionAsync().catch(() => {});
    }
  }

  const current = list[active] ?? list[0];
  const sidePad = (width - CARD_W) / 2;

  return (
    <View style={styles.root}>
      <StepHeader
        title="Your playing style"
        subtitle="Choose the one that best describes your game."
        style={styles.header}
      />

      <View style={styles.badgeWrap}>
        <Text style={styles.badge}>{current.label}</Text>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={onScroll}
        style={styles.carousel}
        contentContainerStyle={{ paddingHorizontal: sidePad, gap: GAP }}>
        {list.map((s, i) => (
          <Pressable
            key={s.id}
            accessibilityRole="button"
            accessibilityLabel={`${s.label}, like ${s.playerName}`}
            accessibilityState={{ selected: i === active }}
            onPress={() => scrollRef.current?.scrollTo({ x: i * SNAP, animated: true })}
            style={[styles.card, i !== active && styles.cardDim]}>
            <Image source={s.image} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition="top" />
            <LinearGradient
              colors={['rgba(246,246,247,0)', colors.neutral.bg]}
              locations={[0.45, 1]}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.cardName} numberOfLines={1}>
              {s.playerName}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.desc}>
        <Text style={styles.descText}>{current.description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // The carousel bleeds edge to edge, so this step has no side padding of its own.
  root: { flex: 1, marginHorizontal: -16 },
  header: { marginBottom: 16, paddingHorizontal: 16 },
  badgeWrap: { alignItems: 'center', marginBottom: 20 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: colors.primary[100],
    fontFamily: fonts.semiboldItalic,
    fontSize: 14,
    letterSpacing: -0.14,
    textTransform: 'uppercase',
    color: colors.primary[800],
  },
  carousel: { flexGrow: 0, marginBottom: 16 },
  card: {
    width: CARD_W,
    height: CARD_H,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 12,
  },
  cardDim: { opacity: 0.55 },
  cardName: { fontFamily: fonts.condensedBold, fontSize: 28, color: colors.black },
  desc: {
    marginHorizontal: 16,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.neutral[100],
  },
  descText: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    color: colors.black,
  },
});
