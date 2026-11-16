import { Image } from 'expo-image';
import { CaretRight } from 'phosphor-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { cubicBezier } from 'react-native-reanimated';

import { colors, fonts } from '@/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Tall photo card used by the role and profession pickers. The selected card
 * grows, swaps its black-and-white photo for a colour one and shows the
 * description; the others shrink.
 */
export default function PhotoChoiceCard({
  label,
  description,
  imageBw,
  imageColor,
  selected,
  anySelected,
  onPress,
  labelSize = 44,
  labelRight = 66,
}) {
  const flex = selected ? 1.45 : anySelected ? 0.55 : 1;

  return (
    <AnimatedPressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      accessibilityHint={description}
      onPress={onPress}
      style={[styles.card, { flex }, styles.flexTransition]}>
      <Image source={imageBw} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition="top" />
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: selected ? 1 : 0 }, styles.fade]}>
        <Image source={imageColor} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition="top" />
      </Animated.View>
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: selected ? 'rgba(10,12,40,0.45)' : 'rgba(20,25,82,0.22)' },
        ]}
      />

      {/* Label reads bottom-to-top along the top-right edge. The wrapper is
          wider than any card so the word is laid out in full before it's
          rotated; otherwise a shrunken card would truncate it. */}
      <View pointerEvents="none" style={[styles.labelWrap, { right: labelRight }]}>
        <Text
          style={[
            styles.label,
            { fontSize: labelSize, lineHeight: labelSize * 1.05 },
            selected && styles.labelSelected,
          ]}>
          {label}
        </Text>
      </View>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.desc,
          { opacity: selected ? 1 : 0, transform: [{ translateY: selected ? 0 : 6 }] },
          styles.descTransition,
        ]}>
        <Text style={styles.descText}>{description}</Text>
      </Animated.View>

      <View style={[styles.chevron, selected && styles.chevronActive]}>
        <CaretRight size={18} color={colors.white} />
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: { minWidth: 0, borderRadius: 20, overflow: 'hidden', backgroundColor: '#0d1020' },
  flexTransition: {
    transitionProperty: 'flex',
    transitionDuration: 320,
    // Reanimated only accepts keyword strings; custom curves go through cubicBezier().
    transitionTimingFunction: cubicBezier(0.4, 0, 0.2, 1),
  },
  fade: { transitionProperty: 'opacity', transitionDuration: 350 },
  labelWrap: { position: 'absolute', top: 16, width: 1000, alignItems: 'flex-end' },
  label: {
    fontFamily: fonts.condensedBoldItalic,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.95)',
    transform: [{ rotate: '-90deg' }],
    transformOrigin: 'top right',
  },
  labelSelected: { color: colors.warning.default },
  desc: { position: 'absolute', bottom: 24, left: 16, right: 60 },
  descTransition: {
    transitionProperty: ['opacity', 'transform'],
    transitionDuration: 250,
    transitionDelay: 80,
  },
  descText: {
    fontFamily: fonts.medium,
    fontSize: 16,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.85)',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  chevron: {
    position: 'absolute',
    bottom: 24,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronActive: { backgroundColor: colors.primary.default, borderColor: colors.primary.default },
});
