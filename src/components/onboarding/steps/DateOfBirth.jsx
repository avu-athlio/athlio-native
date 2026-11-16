import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import StepHeader from '@/components/onboarding/StepHeader';
import { colors, fonts } from '@/theme';

const ITEM_H = 54;
const VISIBLE = 5;
const PAD = ITEM_H * 2; // lets the first/last items reach the centre band

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const NOW = new Date();
const MIN_YEAR = NOW.getFullYear() - 80;
const MAX_YEAR = NOW.getFullYear() - 5;
const YEARS = Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, i) => MIN_YEAR + i);
const DEFAULT_YEAR_IDX = Math.max(0, YEARS.indexOf(2005));

const daysIn = (month0, year) => new Date(year, month0 + 1, 0).getDate();

// One scroll-wheel column. Snaps to rows and reports the centred index.
// `index` is only the starting row; remount (change `key`) to reset it.
function Drum({ items, index, onSelect, format = String, label }) {
  const ref = useRef(null);
  const [visual, setVisual] = useState(index);

  const clamp = (i) => Math.max(0, Math.min(items.length - 1, i));

  function onScroll(e) {
    const i = clamp(Math.round(e.nativeEvent.contentOffset.y / ITEM_H));
    if (i !== visual) {
      setVisual(i);
      Haptics.selectionAsync().catch(() => {});
    }
  }

  function onSettle(e) {
    onSelect(clamp(Math.round(e.nativeEvent.contentOffset.y / ITEM_H)));
  }

  return (
    <View
      style={styles.drum}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: format(items[visual]) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => {
        const next = clamp(visual + (e.nativeEvent.actionName === 'increment' ? 1 : -1));
        ref.current?.scrollTo({ y: next * ITEM_H, animated: true });
        setVisual(next);
        onSelect(next);
      }}>
      <View style={styles.band} pointerEvents="none" />
      <ScrollView
        ref={ref}
        contentOffset={{ x: 0, y: index * ITEM_H }}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={onScroll}
        onMomentumScrollEnd={onSettle}
        onScrollEndDrag={(e) => {
          // No momentum → settle immediately.
          if (!e.nativeEvent.velocity || Math.abs(e.nativeEvent.velocity.y) < 0.05) onSettle(e);
        }}
        contentContainerStyle={{ paddingVertical: PAD }}>
        {items.map((item, i) => (
          <Pressable
            key={i}
            style={styles.item}
            onPress={() => {
              ref.current?.scrollTo({ y: i * ITEM_H, animated: true });
              setVisual(i);
              onSelect(i);
            }}>
            <Text style={[styles.itemText, i === visual && styles.itemSelected]}>{format(item)}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <LinearGradient
        pointerEvents="none"
        colors={[colors.neutral.bg, 'rgba(246,246,247,0.85)', 'rgba(246,246,247,0)']}
        locations={[0, 0.35, 1]}
        style={[styles.fade, styles.fadeTop]}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(246,246,247,0)', 'rgba(246,246,247,0.85)', colors.neutral.bg]}
        locations={[0, 0.65, 1]}
        style={[styles.fade, styles.fadeBottom]}
      />
    </View>
  );
}

function parse(value) {
  if (value) {
    const [y, m, d] = value.split('-').map(Number);
    const yi = YEARS.indexOf(y);
    if (d && m >= 1 && m <= 12) return { d: d - 1, m: m - 1, y: yi >= 0 ? yi : DEFAULT_YEAR_IDX };
  }
  return { d: 11, m: 5, y: DEFAULT_YEAR_IDX }; // 12 Jun 2005, as in the design
}

const toValue = (d, m, y) => {
  const year = YEARS[y];
  const day = Math.min(d, daysIn(m, year) - 1) + 1;
  return `${year}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

// value: "YYYY-MM-DD"
export default function DateOfBirth({ value, onChange }) {
  const [sel, setSel] = useState(() => parse(value));

  // Make sure the form always has a date, even if the user doesn't scroll.
  useEffect(() => {
    if (!value) onChange?.(toValue(sel.d, sel.m, sel.y));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dayCount = daysIn(sel.m, YEARS[sel.y]);
  const days = Array.from({ length: dayCount }, (_, i) => i + 1);
  const dayIdx = Math.min(sel.d, dayCount - 1);

  function update(next) {
    const merged = { ...sel, ...next };
    setSel(merged);
    onChange?.(toValue(merged.d, merged.m, merged.y));
  }

  return (
    <View style={styles.root}>
      <StepHeader
        title="Date of birth"
        subtitle="We use this to show you relevant comparisons and opportunities."
      />
      <View style={styles.pickerShell}>
        <View style={styles.picker}>
          <Drum
            key={`day-${dayCount}`}
            items={days}
            index={dayIdx}
            onSelect={(d) => update({ d })}
            format={(d) => String(d).padStart(2, '0')}
            label="Day"
          />
          <Drum items={MONTHS} index={sel.m} onSelect={(m) => update({ m })} label="Month" />
          <Drum items={YEARS} index={sel.y} onSelect={(y) => update({ y })} label="Year" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  pickerShell: { flex: 1, justifyContent: 'center' },
  picker: { flexDirection: 'row', gap: 16 },
  drum: { flex: 1, height: ITEM_H * VISIBLE, overflow: 'hidden' },
  band: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: PAD,
    height: ITEM_H,
    borderRadius: 8,
    backgroundColor: colors.primary[100],
  },
  item: { height: ITEM_H, alignItems: 'center', justifyContent: 'center' },
  itemText: { fontFamily: fonts.condensedBoldItalic, fontSize: 28, color: colors.neutral[300] },
  itemSelected: { color: colors.black },
  fade: { position: 'absolute', left: 0, right: 0, height: PAD },
  fadeTop: { top: 0 },
  fadeBottom: { bottom: 0 },
});
