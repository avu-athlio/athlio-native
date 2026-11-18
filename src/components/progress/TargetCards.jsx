import { Plus, Trash } from 'phosphor-react-native';
import { useState } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { TargetIcon } from '@/components/icons/NavIcons';
import { Bar, CARD_SHADOW, MUTED } from '@/components/progress/ProgressUI';
import Button from '@/components/ui/Button';
import { TARGET_COLORS } from '@/lib/progress';
import { colors, fonts } from '@/theme';

// Gauge arc from the Figma target card: a 221° arc open at the bottom.
const R = 54;
const CX = 57.9;
const CY = 57.4;
const START = 200.5; // degrees, measured counter-clockwise from 3 o'clock
const SWEEP = 221;
const point = (deg) => {
  const a = (deg * Math.PI) / 180;
  return [CX + R * Math.cos(a), CY - R * Math.sin(a)];
};
function arc(fraction) {
  const end = START - SWEEP * fraction;
  const [x1, y1] = point(START);
  const [x2, y2] = point(end);
  const large = SWEEP * fraction > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2}`;
}

function Gauge({ pct, color }) {
  return (
    <Svg width={115.7} height={81.8} viewBox="0 0 115.7 81.8">
      <Path d={arc(1)} stroke={colors.neutral[100]} strokeWidth={6.76} strokeLinecap="round" fill="none" />
      {pct > 0 ? (
        <Path d={arc(pct / 100)} stroke={color} strokeWidth={6.76} strokeLinecap="round" fill="none" />
      ) : null}
    </Svg>
  );
}

const status = (t) => (t.met ? 'achieved' : t.daysLeft === 0 ? 'last day' : 'ongoing');

/** Main-page target card: gauge with "14/20", name, bar and status. */
export function TargetGauge({ target: t, onPress }) {
  const color = TARGET_COLORS[t.unit] ?? colors.primary[400];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${t.name}: ${t.current} of ${t.target_value}, ${t.pct}%`}
      onPress={onPress}
      style={({ pressed }) => [styles.gaugeCard, pressed && styles.pressed]}>
      <View style={styles.gaugeWrap}>
        <Gauge pct={t.pct} color={color} />
        <View style={styles.gaugeValue}>
          <Text style={styles.big}>{t.current}</Text>
          <Text style={styles.of}>/{t.target_value}</Text>
        </View>
      </View>
      <Text style={styles.gaugeName} numberOfLines={1}>
        {t.name}
      </Text>
      <View style={styles.gaugeFooter}>
        <Bar pct={t.pct} color={color} />
        <View style={styles.statusRow}>
          <Text style={styles.status}>{status(t)}</Text>
          <Text style={[styles.status, { color }]}>{t.pct}%</Text>
        </View>
      </View>
    </Pressable>
  );
}

/** "No targets yet" card with "Add your first target". */
export function TargetsEmpty({ periodLabel, onAdd }) {
  return (
    <View style={styles.empty}>
      <TargetIcon size={48} color={colors.primary[300]} />
      <View style={styles.emptyText}>
        <Text style={styles.emptyTitle}>No targets yet</Text>
        <Text style={styles.emptySub}>Set your first goal to start tracking your progress this {periodLabel}</Text>
      </View>
      <Button type="primary" size="small" label="Add your first target" leadingIcon={Plus} onPress={onAdd} />
    </View>
  );
}

const REVEAL = 72;

/**
 * Targets-page card: name, "Deadline: N days left", big value and bar.
 * Swipe left to reveal Delete (Figma "Delete target"); tap to edit.
 */
export function TargetRow({ target: t, onPress, onDelete }) {
  // Swipe state lives in a closure so nothing is read from refs while rendering.
  const [swipe] = useState(() => {
    const x = new Animated.Value(0);
    let open = false;
    const settle = (to) => {
      open = to !== 0;
      Animated.spring(x, { toValue: to, useNativeDriver: true, bounciness: 0 }).start();
    };
    const base = () => (open ? -REVEAL : 0);
    const pan = PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_, g) => x.setValue(Math.max(-REVEAL - 20, Math.min(0, base() + g.dx))),
      onPanResponderRelease: (_, g) => settle(base() + g.dx < -REVEAL / 2 ? -REVEAL : 0),
      onPanResponderTerminate: () => settle(base()),
    });
    return { x, pan, settle, isOpen: () => open };
  });

  const color = TARGET_COLORS[t.unit] ?? colors.primary[400];
  const deadline = t.met ? 'Target met' : t.daysLeft === 0 ? 'Deadline: today' : `Deadline: ${t.daysLeft} days left`;

  return (
    <View style={styles.rowWrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Delete ${t.name}`}
        onPress={() => {
          swipe.settle(0);
          onDelete();
        }}
        style={styles.deleteAction}>
        <Trash size={28} color={colors.negative.default} />
        <Text style={styles.deleteText}>Delete</Text>
      </Pressable>
      <Animated.View style={{ transform: [{ translateX: swipe.x }] }} {...swipe.pan.panHandlers}>
        <Pressable
          accessibilityRole="button"
          accessibilityHint="Opens the target to edit it. Swipe left to delete."
          accessibilityActions={[{ name: 'delete', label: 'Delete' }]}
          onAccessibilityAction={(e) => e.nativeEvent.actionName === 'delete' && onDelete()}
          onPress={() => (swipe.isOpen() ? swipe.settle(0) : onPress())}
          style={styles.row}>
          <View style={styles.rowTop}>
            <View style={styles.rowText}>
              <Text style={styles.rowName} numberOfLines={1}>
                {t.name}
              </Text>
              <Text style={styles.rowDeadline}>{deadline}</Text>
            </View>
            <View style={styles.rowValue}>
              <Text style={styles.big}>{t.current}</Text>
              <Text style={styles.of}>/{t.target_value}</Text>
            </View>
          </View>
          <View style={styles.rowBar}>
            <Bar pct={t.pct} color={color} height={8} track={colors.neutral[100]} />
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.8 },
  big: { fontFamily: fonts.condensedBoldItalic, fontSize: 44, lineHeight: 48, color: colors.black },
  of: { fontFamily: fonts.condensedMedium, fontSize: 12, color: MUTED, marginBottom: 6, marginLeft: 2 },

  gaugeCard: {
    width: 176,
    paddingHorizontal: 15,
    paddingVertical: 16,
    gap: 16,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: colors.white,
    ...CARD_SHADOW,
  },
  gaugeWrap: { width: 115.7, height: 81.8 },
  gaugeValue: {
    position: 'absolute',
    top: 22,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  gaugeName: { fontFamily: fonts.semibold, fontSize: 14, color: colors.black, alignSelf: 'stretch', textAlign: 'center' },
  gaugeFooter: { alignSelf: 'stretch', gap: 4 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between' },
  status: { fontFamily: fonts.medium, fontSize: 12, color: MUTED },

  empty: {
    alignItems: 'center',
    gap: 16,
    padding: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
    ...CARD_SHADOW,
  },
  emptyText: { alignItems: 'center', gap: 4 },
  emptyTitle: { fontFamily: fonts.semibold, fontSize: 16, color: colors.black },
  emptySub: { fontFamily: fonts.medium, fontSize: 14, color: MUTED, textAlign: 'center' },

  rowWrap: { justifyContent: 'center' },
  deleteAction: {
    position: 'absolute',
    right: 8,
    width: REVEAL - 16,
    alignItems: 'center',
    gap: 2,
  },
  deleteText: { fontFamily: fonts.condensedBoldItalic, fontSize: 14, color: colors.negative.default, textTransform: 'uppercase' },
  row: {
    paddingTop: 12,
    paddingBottom: 20,
    paddingHorizontal: 12,
    gap: 16,
    borderRadius: 12,
    backgroundColor: colors.white,
    ...CARD_SHADOW,
  },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  rowText: { flex: 1, gap: 4 },
  rowName: { fontFamily: fonts.bold, fontSize: 16, color: colors.black },
  rowDeadline: { fontFamily: fonts.medium, fontSize: 14, color: MUTED },
  rowValue: { flexDirection: 'row', alignItems: 'flex-end' },
  rowBar: { paddingHorizontal: 6 },
});
