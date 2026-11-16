import { Image } from 'expo-image';
// The Infinity icon is only exported as InfinityIcon (Infinity is a JS global).
import { ArrowCircleUpLeft, ArrowCircleUpRight, InfinityIcon } from 'phosphor-react-native';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import StepHeader from '@/components/onboarding/StepHeader';
import { colors, fonts } from '@/theme';

const ball = require('@/assets/images/football-ball.png');

// Positions inside the 361×280 group, from the Figma frame.
const OPTIONS = [
  { id: 'left', label: 'Left', icon: ArrowCircleUpLeft, left: 0, top: 50 },
  { id: 'right', label: 'Right', icon: ArrowCircleUpRight, left: 255, top: 47 },
  { id: 'both', label: 'Both', icon: InfinityIcon, left: 127, top: 174 },
];

export default function PreferredLeg({ value, onChange }) {
  // The design is 361pt wide; shrink it on narrow phones.
  const { width } = useWindowDimensions();
  const scale = Math.min(1, (width - 16) / 361);

  return (
    <View style={styles.root}>
      <StepHeader
        title="Which is your stronger foot?"
        subtitle="This helps scouts understand your technical profile."
      />
      <View style={styles.visual}>
        <View style={[styles.group, { transform: [{ scale }] }]} accessibilityRole="radiogroup">
          <View style={styles.ball} pointerEvents="none">
            <Image source={ball} style={styles.ballImg} contentFit="cover" />
          </View>
          {OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const selected = value === opt.id;
            return (
              <Pressable
                key={opt.id}
                onPress={() => onChange(opt.id)}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={`${opt.label} foot`}
                style={({ pressed }) => [
                  styles.btn,
                  { left: opt.left, top: opt.top },
                  selected && styles.btnSelected,
                  pressed && styles.btnPressed,
                ]}>
                <Icon
                  size={32}
                  weight="bold"
                  color={selected ? colors.primary.default : colors.neutral[600]}
                />
                <Text style={styles.btnLabel}>{opt.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  visual: { flex: 1, minHeight: 320, alignItems: 'center', justifyContent: 'center' },
  group: { width: 361, height: 280, marginTop: 54 },
  ball: {
    position: 'absolute',
    left: (361 - 206) / 2,
    top: 0,
    width: 206,
    height: 207,
    borderRadius: 104,
    borderWidth: 11,
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral.bg,
    overflow: 'hidden',
  },
  ballImg: { position: 'absolute', width: '128.64%', height: '128.02%', left: '-15.05%', top: '-14.98%' },
  btn: {
    position: 'absolute',
    width: 106,
    height: 106,
    borderRadius: 53,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: 'rgba(249,249,249,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 3px 10px rgba(0,0,0,0.10)',
  },
  btnSelected: { backgroundColor: colors.primary[100], borderColor: colors.primary.default },
  btnPressed: { transform: [{ scale: 0.93 }] },
  btnLabel: {
    fontFamily: fonts.condensedBoldItalic,
    fontSize: 32,
    lineHeight: 34,
    textTransform: 'uppercase',
    color: colors.black,
  },
});
