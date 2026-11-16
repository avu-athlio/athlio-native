import { ArrowLeft, X } from 'phosphor-react-native';
import { StyleSheet, View } from 'react-native';

import IconButton from '@/components/ui/IconButton';
import { colors } from '@/theme';

// Back arrow + progress bar (+ optional close) shown above every wizard step.
export default function OnboardingTopbar({
  onBack,
  onClose,
  currentStep = 1,
  totalSteps = 1,
  showBack = true,
  dark = false,
}) {
  const total = Math.max(1, totalSteps);
  const step = Math.min(Math.max(currentStep, 0), total);
  const percent = Math.round((step / total) * 100);
  const iconColor = dark ? colors.white : colors.black;

  return (
    <View style={styles.bar}>
      <View style={{ opacity: showBack ? 1 : 0 }} pointerEvents={showBack ? 'auto' : 'none'}>
        <IconButton
          size="small"
          icon={ArrowLeft}
          color={iconColor}
          onPress={onBack}
          accessibilityLabel="Back"
        />
      </View>

      <View
        style={[styles.track, dark && styles.trackDark]}
        accessibilityRole="progressbar"
        accessibilityLabel={`Step ${step} of ${total}`}
        accessibilityValue={{ min: 0, max: 100, now: percent }}>
        <View style={[styles.fill, { width: `${percent}%` }]} />
      </View>

      {onClose ? (
        <IconButton
          size="small"
          icon={X}
          color={iconColor}
          onPress={onClose}
          accessibilityLabel="Close"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
  },
  track: {
    flex: 1,
    height: 8,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.neutral[300],
  },
  trackDark: { backgroundColor: 'rgba(255,255,255,0.25)' },
  fill: { height: '100%', borderRadius: 8, backgroundColor: colors.primary.default },
});
