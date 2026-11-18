import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/theme';

/**
 * variant — "default": big italic numbers on a blue band (date of birth)
 *         | "plain":   iOS-style picker from the Figma "Minutes played" sheet:
 *                      hairlines around the centre row, text shrinks and greys out away from it.
 */
const VARIANTS = {
  default: { itemH: 54, visible: 5, fade: colors.neutral.bg, fadeMid: 'rgba(246,246,247,0.85)', fadeEnd: 'rgba(246,246,247,0)' },
  plain: { itemH: 30, visible: 7, fade: colors.white, fadeMid: 'rgba(255,255,255,0.6)', fadeEnd: 'rgba(255,255,255,0)' },
};

// Text style for the "plain" wheel by distance from the centre row.
const PLAIN_TEXT = [
  { fontSize: 23, color: colors.black },
  { fontSize: 18, color: colors.neutral[400] },
  { fontSize: 14, color: colors.neutral[400] },
  { fontSize: 12, color: colors.neutral[300] },
];

// One scroll-wheel column. Snaps to rows and reports the centred index.
// `index` is only the starting row; remount (change `key`) to reset it.
export default function Drum({ items, index, onSelect, format = String, label, variant = 'default' }) {
  const ref = useRef(null);
  const [visual, setVisual] = useState(index);
  const v = VARIANTS[variant] ?? VARIANTS.default;
  const itemH = v.itemH;
  const pad = itemH * Math.floor(v.visible / 2); // lets the first/last items reach the centre
  const plain = variant === 'plain';

  const clamp = (i) => Math.max(0, Math.min(items.length - 1, i));

  function onScroll(e) {
    const i = clamp(Math.round(e.nativeEvent.contentOffset.y / itemH));
    if (i !== visual) {
      setVisual(i);
      Haptics.selectionAsync().catch(() => {});
    }
  }

  function onSettle(e) {
    onSelect(clamp(Math.round(e.nativeEvent.contentOffset.y / itemH)));
  }

  return (
    <View
      style={[styles.drum, { height: itemH * v.visible }]}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: format(items[visual]) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => {
        const next = clamp(visual + (e.nativeEvent.actionName === 'increment' ? 1 : -1));
        ref.current?.scrollTo({ y: next * itemH, animated: true });
        setVisual(next);
        onSelect(next);
      }}>
      <View style={[plain ? styles.lines : styles.band, { top: pad, height: itemH }]} pointerEvents="none" />
      <ScrollView
        ref={ref}
        contentOffset={{ x: 0, y: index * itemH }}
        showsVerticalScrollIndicator={false}
        snapToInterval={itemH}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={onScroll}
        onMomentumScrollEnd={onSettle}
        onScrollEndDrag={(e) => {
          // No momentum → settle immediately.
          if (!e.nativeEvent.velocity || Math.abs(e.nativeEvent.velocity.y) < 0.05) onSettle(e);
        }}
        contentContainerStyle={{ paddingVertical: pad }}>
        {items.map((item, i) => (
          <Pressable
            key={i}
            style={[styles.item, { height: itemH }]}
            onPress={() => {
              ref.current?.scrollTo({ y: i * itemH, animated: true });
              setVisual(i);
              onSelect(i);
            }}>
            <Text
              style={
                plain
                  ? [styles.plainText, PLAIN_TEXT[Math.min(Math.abs(i - visual), PLAIN_TEXT.length - 1)]]
                  : [styles.itemText, i === visual && styles.itemSelected]
              }>
              {format(item)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      {plain ? null : (
        <>
          <LinearGradient
            pointerEvents="none"
            colors={[v.fade, v.fadeMid, v.fadeEnd]}
            locations={[0, 0.35, 1]}
            style={[styles.fade, styles.fadeTop, { height: pad }]}
          />
          <LinearGradient
            pointerEvents="none"
            colors={[v.fadeEnd, v.fadeMid, v.fade]}
            locations={[0, 0.65, 1]}
            style={[styles.fade, styles.fadeBottom, { height: pad }]}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  drum: { flex: 1, overflow: 'hidden' },
  band: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: 8,
    backgroundColor: colors.primary[100],
  },
  lines: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.neutral[300],
  },
  item: { alignItems: 'center', justifyContent: 'center' },
  itemText: { fontFamily: fonts.condensedBoldItalic, fontSize: 28, color: colors.neutral[300] },
  itemSelected: { color: colors.black },
  plainText: { fontFamily: fonts.regular },
  fade: { position: 'absolute', left: 0, right: 0 },
  fadeTop: { top: 0 },
  fadeBottom: { bottom: 0 },
});
