import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CARD_SHADOW, MUTED, PRO_GRADIENT } from '@/components/progress/ProgressUI';
import Button from '@/components/ui/Button';
import { colors, fonts } from '@/theme';

// Day icons from the Figma training picker. Recovery's yoga mat is drawn
// smaller inside the same 28px box.
export const DAY_ICONS = {
  individual: { src: require('@/assets/images/progress/day-individual.svg'), w: 28, h: 28 },
  team: { src: require('@/assets/images/progress/day-team.svg'), w: 28, h: 28 },
  match: { src: require('@/assets/images/progress/day-match.svg'), w: 28, h: 28 },
  recovery: { src: require('@/assets/images/progress/day-recovery.svg'), w: 24.8, h: 17.8 },
};

export function DayIcon({ kind, size = 28 }) {
  const icon = DAY_ICONS[kind];
  if (!icon) return <View style={{ width: size, height: size }} />;
  const k = size / 28;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Image source={icon.src} style={{ width: icon.w * k, height: icon.h * k }} />
    </View>
  );
}

// Dot under a day (dayStatus): green = done, red = missed, blue = planned, grey = nothing.
export const DOT_COLORS = {
  done: colors.success[600],
  missed: colors.negative.default,
  planned: colors.primary.default,
  none: colors.neutral[100],
};

/** Pro page week strip: M T W TH F SA S with icon + dot; today outlined. */
export function WeekStrip({ days, onPressDay }) {
  return (
    <View style={styles.week}>
      {days.map((d) => (
        <Pressable
          key={d.key}
          accessibilityRole="button"
          accessibilityLabel={`${d.label}: ${d.kind ? `${d.kind}, ${d.dot}` : 'nothing'}`}
          onPress={() => onPressDay(d)}
          style={[styles.weekDay, d.today && styles.weekToday]}>
          {d.kind ? <DayIcon kind={d.kind} /> : null}
          <Text style={[styles.weekLabel, d.today && styles.weekLabelToday]}>{d.short}</Text>
          <View style={[styles.dot, { backgroundColor: DOT_COLORS[d.dot] }]} />
        </Pressable>
      ))}
    </View>
  );
}

const HERO = require('@/assets/images/progress/matchday.jpg');

/**
 * The photo card under the days: "Give your best. / We will track the rest."
 * `tag` = "Match day" etc. `action` = button label inside the card (main page);
 * leave it out to put the button under the card (Trainings page).
 */
export function DayHero({ tag, action, onAction, height = 234 }) {
  return (
    <View style={[styles.hero, { height }]}>
      <Image source={HERO} style={StyleSheet.absoluteFill} contentFit="cover" />
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.6)']}
        locations={[0.5, 0.99]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.heroTop}>
        {tag ? (
          <View style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.heroBottom}>
        <View>
          <Text style={styles.heroLine}>Give your best.</Text>
          {/* Figma fills this line with the green Pro gradient; the first colour is close enough on a photo. */}
          <Text style={[styles.heroLine, { color: PRO_GRADIENT[0] }]}>We will track the rest.</Text>
        </View>
        {action ? <Button type="white" size="small" label={action} onPress={onAction} fullWidth /> : null}
      </View>
    </View>
  );
}

/** Horizontal date chips on the Trainings page ("WED 10 •"). */
export function DateChip({ day, selected, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${day.weekday} ${day.date}`}
      onPress={onPress}
      style={[styles.dateChip, selected && styles.dateChipSelected]}>
      <Text style={[styles.dateWeekday, selected && styles.dateSelectedText]}>{day.weekday}</Text>
      <Text style={[styles.dateNum, selected && styles.dateSelectedText]}>{day.date}</Text>
      <View style={[styles.dot, { backgroundColor: day.dot === 'none' ? 'transparent' : DOT_COLORS[day.dot] }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  week: { flexDirection: 'row', gap: 4 },
  weekDay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    paddingVertical: 12,
    minHeight: 88,
    borderRadius: 12,
    backgroundColor: colors.white,
    ...CARD_SHADOW,
  },
  weekToday: { borderWidth: 2, borderColor: '#5d6bfd', paddingVertical: 10 },
  weekLabel: { fontFamily: fonts.condensedSemibold, fontSize: 16, letterSpacing: -0.8, color: MUTED, textTransform: 'uppercase' },
  weekLabelToday: { color: colors.black },
  dot: { width: 10, height: 10, borderRadius: 5 },

  hero: { borderRadius: 12, overflow: 'hidden', padding: 8, justifyContent: 'space-between' },
  heroTop: { flexDirection: 'row', justifyContent: 'flex-end' },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: colors.primary.default,
    backgroundColor: 'rgba(219,233,255,0.2)',
  },
  tagText: { fontFamily: fonts.semiboldItalic, fontSize: 14, letterSpacing: -0.14, color: colors.white, textTransform: 'uppercase' },
  heroBottom: { gap: 8 },
  heroLine: {
    fontFamily: fonts.condensedBoldItalic,
    fontSize: 28,
    lineHeight: 28,
    color: colors.white,
    textTransform: 'uppercase',
  },

  dateChip: { width: 52, alignItems: 'center', gap: 2, paddingVertical: 8, borderRadius: 12, borderWidth: 2, borderColor: 'transparent' },
  dateChipSelected: { borderColor: '#5d6bfd', backgroundColor: colors.white },
  dateWeekday: { fontFamily: fonts.condensedSemibold, fontSize: 12, color: MUTED, textTransform: 'uppercase' },
  dateNum: { fontFamily: fonts.condensedSemibold, fontSize: 20, color: MUTED },
  dateSelectedText: { color: colors.black },
});
