import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import StepHeader from '@/components/onboarding/StepHeader';
import { colors, fonts } from '@/theme';

const pitch = require('@/assets/images/position-bg.png');
const MAX_POSITIONS = 3;

// left = horizontal centre %, top = % of screen height (Figma 393×852 frame).
const FOOTBALL_POSITIONS = [
  { id: 'st', label: 'ST', left: 50.0, top: 25.7 },
  { id: 'lw', label: 'LW', left: 29.5, top: 31.3 },
  { id: 'rw', label: 'RW', left: 70.2, top: 31.3 },
  { id: 'cam', label: 'CAM', left: 49.6, top: 37.0 },
  { id: 'lm', label: 'LM', left: 23.4, top: 47.1 },
  { id: 'cm', label: 'CM', left: 50.0, top: 46.7 },
  { id: 'rm', label: 'RM', left: 76.3, top: 46.7 },
  { id: 'cdm', label: 'CDM', left: 50.0, top: 57.4 },
  { id: 'lb', label: 'LB', left: 26.5, top: 64.8 },
  { id: 'cb', label: 'CB', left: 50.0, top: 68.2 },
  { id: 'rb', label: 'RB', left: 73.3, top: 64.8 },
  { id: 'gk', label: 'GK', left: 50.0, top: 78.4 },
];

const BTN_W = 64;

function Jersey({ color }) {
  return (
    <Svg viewBox="0 0 24 18" width={26} height={20}>
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        fill={color}
        d="M23.21 2.739 18.358.094A.75.75 0 0 0 17.999 0h-3a.75.75 0 0 0-.75.75c0 .597-.237 1.169-.659 1.591A2.25 2.25 0 0 1 12 3a2.25 2.25 0 0 1-2.25-2.25.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.361.094L.787 2.739a1.5 1.5 0 0 0-.617 2.003l1.806 3.451A1.5 1.5 0 0 0 3.343 9H5.25v7.5A1.5 1.5 0 0 0 6.75 18h10.5a1.5 1.5 0 0 0 1.5-1.5V9h1.906a1.5 1.5 0 0 0 1.367-.807l1.806-3.451a1.5 1.5 0 0 0-.617-2.003Z"
      />
    </Svg>
  );
}

/**
 * Full-screen step: renders its own pitch background. `contentTop` is the
 * height of the top bar so the header sits where other steps' headers do.
 */
export default function PositionSelect({ value = [], onChange, contentTop = 0 }) {
  const [limitHit, setLimitHit] = useState(false);
  const timer = useRef(null);
  const selected = Array.isArray(value) ? value : [];

  function toggle(id) {
    if (selected.includes(id)) {
      setLimitHit(false);
      return onChange(selected.filter((p) => p !== id));
    }
    if (selected.length >= MAX_POSITIONS) {
      setLimitHit(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setLimitHit(false), 1500);
      return;
    }
    setLimitHit(false);
    onChange([...selected, id]);
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      <Image source={pitch} style={StyleSheet.absoluteFill} contentFit="cover" />
      <LinearGradient
        colors={['rgba(0,0,0,0.75)', 'rgba(0,0,0,0)']}
        locations={[0, 0.38]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.55)']}
        locations={[0.72, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={[styles.header, { paddingTop: contentTop + 8 }]}>
        <StepHeader
          light
          title="Choose your position"
          subtitle={`You can select up to ${MAX_POSITIONS} positions`}
          subtitleColor={limitHit ? colors.negative.default : undefined}
        />
      </View>

      {FOOTBALL_POSITIONS.map((p) => {
        const isSelected = selected.includes(p.id);
        return (
          <Pressable
            key={p.id}
            onPress={() => toggle(p.id)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isSelected }}
            accessibilityLabel={p.label}
            style={({ pressed }) => [
              styles.btn,
              { left: `${p.left}%`, top: `${p.top}%` },
              pressed && styles.btnPressed,
            ]}>
            <Text style={styles.btnLabel}>{p.label}</Text>
            <View style={[styles.circle, isSelected && styles.circleSelected]}>
              <Jersey color={isSelected ? colors.white : colors.primary.default} />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16 },
  btn: {
    position: 'absolute',
    width: BTN_W,
    marginLeft: -BTN_W / 2,
    alignItems: 'center',
    gap: 4,
  },
  btnPressed: { transform: [{ scale: 0.9 }] },
  btnLabel: {
    fontFamily: fonts.semiboldItalic,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -1,
    textTransform: 'uppercase',
    color: colors.white,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  circle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
  },
  circleSelected: { backgroundColor: colors.primary.default },
});
