import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { CaretDown, LockSimple } from 'phosphor-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Button from '@/components/ui/Button';
import { colors, fonts } from '@/theme';

// Small pieces shared by the Progress screens (Figma "Progress" section).

export const MUTED = '#72717a';
export const PRO_GRADIENT = ['#33f578', '#e7fc6f'];
export const CARD_SHADOW = { boxShadow: '0 0 21px rgba(0,0,0,0.08)' };

const STRIPES = {
  season: [
    require('@/assets/images/progress/season-stripe-1.svg'),
    require('@/assets/images/progress/season-stripe-2.svg'),
    require('@/assets/images/progress/season-stripe-3.svg'),
  ],
  paywall: [
    require('@/assets/images/progress/paywall-stripe-1.svg'),
    require('@/assets/images/progress/paywall-stripe-2.svg'),
    require('@/assets/images/progress/paywall-stripe-3.svg'),
  ],
};
// Figma frames of the three diagonal strokes (their SVGs include the stroke overhang).
const STRIPE_FRAMES = [
  { left: -68.5, top: -27.5, width: 409, height: 367 },
  { left: 1, top: -26, width: 374, height: 332 },
  { left: 118.5, top: -70.5, width: 349, height: 298 },
];

/** Rounded card with the three diagonal light stripes (season card, paywall). */
export function StripedCard({ variant = 'season', style, children }) {
  return (
    <View style={[styles.striped, variant === 'paywall' ? styles.paywallBg : styles.seasonBg, style]}>
      {STRIPES[variant].map((src, i) => (
        <Image key={i} source={src} style={[styles.stripe, STRIPE_FRAMES[i]]} contentFit="fill" />
      ))}
      {children}
    </View>
  );
}

/** Green "PRO" pill. */
export function ProBadge({ size = 24 }) {
  return (
    <LinearGradient
      colors={PRO_GRADIENT}
      start={{ x: 0, y: 0.7 }}
      end={{ x: 1, y: 0.3 }}
      style={styles.pro}
      accessibilityLabel="Pro">
      <Text style={[styles.proText, { fontSize: size }]}>PRO</Text>
    </LinearGradient>
  );
}

/** Title + subtitle on the left, an action (e.g. "See all") on the right. */
export function SectionHeader({ title, subtitle, onSeeAll, right }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionText}>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? <Text style={styles.sectionSub}>{subtitle}</Text> : null}
      </View>
      {right}
      {onSeeAll ? (
        <Pressable accessibilityRole="button" onPress={onSeeAll} hitSlop={8} style={styles.seeAll}>
          <Text style={styles.seeAllText}>See all</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Grey chip with a caret that opens a picker ("All world ⌄", "This month ⌄"). */
export function DropdownChip({ label, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}, change`}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, pressed && styles.pressed]}>
      <Text style={styles.chipText}>{label}</Text>
      <CaretDown size={18} color={colors.primary[700]} />
    </Pressable>
  );
}

/**
 * Season / Month / Week pill tabs. `locked` ids show a lock and call
 * `onLocked` instead of switching.
 */
export function PeriodTabs({ tabs, value, onChange, locked = [], onLocked }) {
  return (
    <View style={styles.tabs} accessibilityRole="tablist">
      {tabs.map((t) => {
        const active = t.value === value;
        const isLocked = locked.includes(t.value);
        return (
          <Pressable
            key={t.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={isLocked ? `${t.label}, Pro only` : t.label}
            onPress={() => (isLocked ? onLocked?.() : onChange(t.value))}
            style={[styles.tab, active && styles.tabActive]}>
            {isLocked ? <LockSimple size={16} color={colors.neutral[500]} /> : null}
            <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const DELTA_ICONS = {
  up: require('@/assets/images/progress/delta-up.svg'),
  down: require('@/assets/images/progress/delta-down.svg'),
  same: require('@/assets/images/progress/delta-same.svg'),
};
const DELTA_COLORS = { up: colors.success[500], down: colors.negative.default, same: colors.warning[500] };

/** ▲ 3 more / ▼ 2 less / — same. `pill` adds the soft background used on white cards. */
export function Delta({ value, text, pill = false, size = 16, upColor }) {
  if (value == null) return null;
  const kind = value > 0 ? 'up' : value < 0 ? 'down' : 'same';
  const color = kind === 'up' && upColor ? upColor : DELTA_COLORS[kind];
  return (
    <View style={[styles.delta, pill && styles.deltaPill, pill && { backgroundColor: PILL_BG[kind] }]}>
      <Image source={DELTA_ICONS[kind]} style={{ width: size, height: size }} />
      <Text style={[styles.deltaText, { color, fontSize: size <= 12 ? 10 : 12 }]}>{text}</Text>
    </View>
  );
}
const PILL_BG = { up: colors.success[50], down: colors.negative[50], same: colors.warning[50] };

/** Green AI-style hint card with the sparkle tile. */
export function TipCard({ title, text }) {
  return (
    <View style={styles.tip}>
      <LinearGradient colors={PRO_GRADIENT} start={{ x: 0, y: 0.7 }} end={{ x: 1, y: 0.3 }} style={styles.tipIcon}>
        <Image source={require('@/assets/images/progress/sparkle.svg')} style={styles.sparkle} />
      </LinearGradient>
      <View style={styles.tipText}>
        <Text style={styles.tipTitle}>{title}</Text>
        {text ? <Text style={styles.tipBody}>{text}</Text> : null}
      </View>
    </View>
  );
}

/** Thin rounded progress bar. */
export function Bar({ pct, color = colors.primary[400], height = 4, track = colors.neutral[200] }) {
  return (
    <View style={[styles.bar, { height, borderRadius: height / 2, backgroundColor: track }]}>
      <View style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height, borderRadius: height / 2, backgroundColor: color }} />
    </View>
  );
}

/** Navy shield used in the leaderboard ("rating" badge). */
export function ShieldBadge({ value, big = false }) {
  const w = big ? 32 : 28;
  const h = big ? 38.5 : 33.7;
  return (
    <View style={{ width: w, height: big ? 33 : 29 }}>
      <Image source={require('@/assets/images/progress/ovr-shield.svg')} style={{ position: 'absolute', width: w, height: h }} />
      <Image source={require('@/assets/images/progress/ovr-shade.svg')} style={{ position: 'absolute', width: w, height: h }} />
      <Text style={[styles.shieldText, big && styles.shieldTextBig]}>{value}</Text>
    </View>
  );
}

/** Dark-blue "Unlock pro features" card. */
export function PaywallCard({ onUnlock }) {
  return (
    <StripedCard variant="paywall" style={styles.paywall}>
      <View style={styles.paywallBody}>
        <ProBadge />
        <View style={styles.paywallText}>
          <Text style={styles.paywallTitle}>Unlock pro features</Text>
          <Text style={styles.paywallSub}>
            Get AI insights, advanced analytics, and full scout visibility. Take your career to the next level.
          </Text>
        </View>
        <Button type="secondary" size="medium" label="Unlock Premium" onPress={onUnlock} fullWidth />
      </View>
    </StripedCard>
  );
}

/** Centered "PRO · This feature is locked" block (Targets month/week for free athletes). */
export function LockedFeature({ text, onUnlock }) {
  return (
    <View style={styles.locked}>
      <ProBadge size={20} />
      <Text style={styles.lockedTitle}>This feature is locked</Text>
      <Text style={styles.lockedText}>{text}</Text>
      <Button type="primary" size="medium" label="Unlock Premium" onPress={onUnlock} style={styles.lockedButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  striped: { overflow: 'hidden', borderRadius: 24 },
  seasonBg: { backgroundColor: colors.primary.default },
  paywallBg: { backgroundColor: colors.primary[900] },
  stripe: { position: 'absolute' },

  pro: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingTop: 2,
    paddingBottom: 4,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: colors.white,
  },
  proText: { fontFamily: fonts.condensedBoldItalic, color: colors.black, textTransform: 'uppercase' },

  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 },
  sectionText: { flexShrink: 1, gap: 2 },
  sectionTitle: { fontFamily: fonts.semibold, fontSize: 18, color: colors.black },
  sectionSub: { fontFamily: fonts.medium, fontSize: 14, color: MUTED },
  seeAll: { height: 32, paddingHorizontal: 12, justifyContent: 'center' },
  seeAllText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.primary.default },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[100],
  },
  chipText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.primary[700] },
  pressed: { opacity: 0.7 },

  tabs: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: 9999, backgroundColor: colors.neutral[100] },
  tab: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 100,
  },
  tabActive: { backgroundColor: 'rgba(255,255,255,0.9)' },
  tabText: { fontFamily: fonts.boldItalic, fontSize: 14, color: colors.neutral[500], textTransform: 'uppercase' },
  tabTextActive: { color: colors.black },

  delta: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  deltaPill: { gap: 4, paddingHorizontal: 4, paddingVertical: 2, borderRadius: 100 },
  deltaText: { fontFamily: fonts.medium },

  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: colors.success[50],
  },
  tipIcon: { padding: 12, borderRadius: 12, borderWidth: 2, borderColor: colors.white },
  sparkle: { width: 28, height: 28 },
  tipText: { flex: 1, gap: 2 },
  tipTitle: { fontFamily: fonts.semibold, fontSize: 14, color: colors.black },
  tipBody: { fontFamily: fonts.medium, fontSize: 14, color: MUTED },

  bar: { width: '100%', overflow: 'hidden' },

  shieldText: {
    position: 'absolute',
    top: 2,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: fonts.condensedSemiboldItalic,
    fontSize: 16,
    color: colors.white,
  },
  shieldTextBig: { fontSize: 20, top: 1 },

  paywall: { paddingHorizontal: 12, paddingVertical: 20 },
  paywallBody: { gap: 16, alignItems: 'center' },
  paywallText: { gap: 4, alignItems: 'center' },
  paywallTitle: {
    fontFamily: fonts.condensedBoldItalic,
    fontSize: 32,
    color: colors.white,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  paywallSub: { fontFamily: fonts.medium, fontSize: 14, color: colors.primary[300], textAlign: 'center' },

  locked: { alignItems: 'center', gap: 8, paddingHorizontal: 16 },
  lockedTitle: { fontFamily: fonts.semibold, fontSize: 18, color: colors.black, marginTop: 8 },
  lockedText: { fontFamily: fonts.medium, fontSize: 14, color: MUTED, textAlign: 'center' },
  lockedButton: { marginTop: 16, minWidth: 246 },
});
