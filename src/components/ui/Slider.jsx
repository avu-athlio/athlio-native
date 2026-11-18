import * as Haptics from 'expo-haptics';
import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/theme';

const THUMB = 21;

/**
 * Whole-number slider from the Figma "Effort rating": value above in big
 * italic, 7px track, round thumb, min / max labels underneath.
 * Drag or tap anywhere on the track; screen readers can increment/decrement.
 */
export default function Slider({ value, onChange, min = 0, max = 10, label }) {
  const [width, setWidth] = useState(0);
  const last = useRef(value);
  const span = max - min;
  const pct = span ? (value - min) / span : 0;

  const setFromX = (x) => {
    if (!width) return;
    const ratio = Math.max(0, Math.min(1, (x - THUMB / 2) / (width - THUMB)));
    const next = Math.round(min + ratio * span);
    if (next !== last.current) {
      last.current = next;
      Haptics.selectionAsync().catch(() => {});
      onChange(next);
    }
  };

  const step = (d) => {
    const next = Math.max(min, Math.min(max, value + d));
    last.current = next;
    onChange(next);
  };

  return (
    <View>
      <Text style={styles.value}>{value}</Text>
      <View
        style={styles.hit}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderTerminationRequest={() => false}
        onResponderGrant={(e) => setFromX(e.nativeEvent.locationX)}
        onResponderMove={(e) => setFromX(e.nativeEvent.locationX)}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ min, max, now: value }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => step(e.nativeEvent.actionName === 'increment' ? 1 : -1)}>
        <View pointerEvents="none" style={styles.track}>
          <View style={[styles.fill, { width: THUMB / 2 + pct * (width - THUMB) }]} />
        </View>
        <View pointerEvents="none" style={[styles.thumb, { left: pct * (width - THUMB) }]} />
      </View>
      <View style={styles.ends}>
        <Text style={styles.end}>{min}</Text>
        <Text style={styles.end}>{max}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  value: {
    fontFamily: fonts.condensedBoldItalic,
    fontSize: 32,
    color: colors.black,
    textAlign: 'center',
    marginBottom: 8,
  },
  hit: { height: 32, justifyContent: 'center' },
  track: { height: 7, borderRadius: 8, backgroundColor: colors.neutral[200], overflow: 'hidden' },
  fill: { height: 7, borderRadius: 8, backgroundColor: colors.primary[400] },
  thumb: {
    position: 'absolute',
    top: (32 - THUMB) / 2,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: colors.primary[400],
  },
  ends: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  end: { fontFamily: fonts.semibold, fontSize: 18, color: colors.neutral[700] },
});
