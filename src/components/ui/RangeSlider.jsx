import * as Haptics from 'expo-haptics';
import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/theme';

const THUMB = 21;
const HIT = 32;

/**
 * Two-thumb whole-number range (Figma "Age 0 – 40"). value: [low, high].
 * The thumb nearest the touch moves; `maxLabel` lets the top end read "40+".
 * Screen readers get one adjustable control per thumb.
 */
export default function RangeSlider({ value, onChange, min = 0, max = 40, label, maxLabel }) {
  const [width, setWidth] = useState(0);
  const active = useRef(0);
  const [low, high] = value;
  const span = max - min;
  const usable = Math.max(1, width - THUMB);
  const toX = (v) => ((v - min) / span) * usable;
  const fmtHigh = (v) => (v === max && maxLabel ? maxLabel : String(v));

  const valueAt = (x) => Math.round(min + Math.max(0, Math.min(1, (x - THUMB / 2) / usable)) * span);

  const move = (x, pick) => {
    const v = valueAt(x);
    if (pick) active.current = Math.abs(v - low) <= Math.abs(v - high) && !(v > high) ? 0 : 1;
    const next = active.current === 0 ? [Math.min(v, high), high] : [low, Math.max(v, low)];
    if (next[0] !== low || next[1] !== high) {
      Haptics.selectionAsync().catch(() => {});
      onChange(next);
    }
  };

  const step = (i, d) => {
    if (i === 0) onChange([Math.max(min, Math.min(high, low + d)), high]);
    else onChange([low, Math.min(max, Math.max(low, high + d))]);
  };

  return (
    <View>
      <Text style={styles.value}>
        {low} - {fmtHigh(high)}
      </Text>
      <View
        style={styles.hit}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderTerminationRequest={() => false}
        onResponderGrant={(e) => move(e.nativeEvent.locationX, true)}
        onResponderMove={(e) => move(e.nativeEvent.locationX, false)}>
        <View pointerEvents="none" style={styles.track}>
          <View style={[styles.fill, { left: toX(low) + THUMB / 2, width: toX(high) - toX(low) }]} />
        </View>
        {[low, high].map((v, i) => (
          <View
            key={i}
            pointerEvents="none"
            style={[styles.thumb, { left: toX(v) }]}
            accessible
            accessibilityRole="adjustable"
            accessibilityLabel={`${label} ${i === 0 ? 'minimum' : 'maximum'}`}
            accessibilityValue={{ min, max, now: v, text: i === 0 ? String(v) : fmtHigh(v) }}
            accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
            onAccessibilityAction={(e) => step(i, e.nativeEvent.actionName === 'increment' ? 1 : -1)}
          />
        ))}
      </View>
      <View style={styles.ends}>
        <Text style={styles.end}>{min}</Text>
        <Text style={styles.end}>{maxLabel ?? max}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  value: { fontFamily: fonts.condensedBoldItalic, fontSize: 32, color: colors.black, textAlign: 'center', marginBottom: 8 },
  hit: { height: HIT, justifyContent: 'center' },
  track: { height: 7, borderRadius: 8, backgroundColor: colors.neutral[200] },
  fill: { position: 'absolute', top: 0, height: 7, borderRadius: 8, backgroundColor: colors.primary[400] },
  thumb: {
    position: 'absolute',
    top: (HIT - THUMB) / 2,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: colors.primary[400],
  },
  ends: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  end: { fontFamily: fonts.semibold, fontSize: 18, color: colors.neutral[700] },
});
