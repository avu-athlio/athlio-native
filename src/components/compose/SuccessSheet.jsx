import { X } from 'phosphor-react-native';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Modal, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import IconButton from '@/components/ui/IconButton';
import { colors, fonts, type } from '@/theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const CIRCLE =
  'M45 1.57895C50.7021 1.57895 56.3484 2.70207 61.6165 4.88418C66.8846 7.06629 71.6713 10.2647 75.7033 14.2967C79.7353 18.3287 82.9337 23.1154 85.1158 28.3835C87.2979 33.6516 88.4211 39.2979 88.4211 45C88.4211 50.7021 87.2979 56.3484 85.1158 61.6165C82.9337 66.8846 79.7353 71.6713 75.7033 75.7033C71.6713 79.7353 66.8846 82.9337 61.6165 85.1158C56.3484 87.2979 50.7021 88.4211 45 88.4211C39.2979 88.4211 33.6516 87.2979 28.3835 85.1158C23.1154 82.9337 18.3287 79.7353 14.2967 75.7033C10.2647 71.6713 7.06628 66.8846 4.88417 61.6165C2.70206 56.3484 1.57894 50.7021 1.57895 45C1.57895 39.2978 2.70207 33.6515 4.88419 28.3835C7.0663 23.1154 10.2647 18.3287 14.2967 14.2967C18.3287 10.2646 23.1154 7.06628 28.3835 4.88417C33.6516 2.70206 39.2979 1.57894 45 1.57895L45 1.57895Z';
const CHECK = 'M26.0526 44.3684L39.3701 57.6316L64.7368 32.3684';
const CIRCLE_LEN = 274;
const CHECK_LEN = 56;
const AUTO_CLOSE_MS = 2700; // circle 1.4s + check 0.5s + pause, as on web

/**
 * Port of the web SuccessPopover (and AddMatch's "Match is added" sheet):
 * a bottom sheet whose circle and check draw themselves, then it closes.
 * `children` go under the subtitle (e.g. the match link row).
 * `autoClose` false keeps it open (when there's something to tap).
 */
export default function SuccessSheet({ visible, title, subtitle, onClose, autoClose = true, children }) {
  const insets = useSafeAreaInsets();
  const [circle] = useState(() => new Animated.Value(CIRCLE_LEN));
  const [check] = useState(() => new Animated.Value(CHECK_LEN));
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!visible) return undefined;
    let cancelled = false;
    let timer;
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled) return;
      if (reduce) {
        circle.setValue(0);
        check.setValue(0);
      } else {
        circle.setValue(CIRCLE_LEN);
        check.setValue(CHECK_LEN);
        Animated.sequence([
          Animated.timing(circle, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
          Animated.timing(check, { toValue: 0, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: false }),
        ]).start();
      }
      AccessibilityInfo.announceForAccessibility(title);
      if (autoClose) timer = setTimeout(() => closeRef.current?.(), AUTO_CLOSE_MS);
    });
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [visible, autoClose, title, circle, check]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 24 }]}>
          <View style={styles.header}>
            <IconButton size="large" icon={X} onPress={onClose} accessibilityLabel="Close" />
          </View>
          <View style={styles.content}>
            <Svg width={90} height={90} viewBox="0 0 90 90" fill="none" accessibilityElementsHidden importantForAccessibility="no">
              <AnimatedPath
                d={CIRCLE}
                stroke={colors.primary[500]}
                strokeWidth={3.15789}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={CIRCLE_LEN}
                strokeDashoffset={circle}
              />
              <AnimatedPath
                d={CHECK}
                stroke={colors.primary[500]}
                strokeWidth={3.15789}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={CHECK_LEN}
                strokeDashoffset={check}
              />
            </Svg>
            <View style={styles.text}>
              <Text style={styles.title} accessibilityRole="header">
                {title}
              </Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            {children}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: colors.white },
  header: { flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 20, paddingHorizontal: 16 },
  content: { alignItems: 'center', gap: 32, paddingTop: 20, paddingHorizontal: 16 },
  text: { alignItems: 'center', gap: 4 },
  title: { ...type['heading-4xl-italic'], color: colors.black, textAlign: 'center' },
  subtitle: { fontFamily: fonts.medium, fontSize: 14, color: colors.muted, textAlign: 'center', maxWidth: 280 },
});
