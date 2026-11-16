import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Button from '@/components/ui/Button';
import { colors } from '@/theme';

// Bottom action bar for the wizard: primary Continue/Finish, optional secondary (Skip…).
export default function OnboardingNavbar({
  onNext,
  onFinish,
  showFinish = false,
  canContinue = true,
  dark = false,
  primaryLabel = null,
  secondaryLabel = null,
  onSecondary = null,
  busy = false,
}) {
  const insets = useSafeAreaInsets();
  const hasSplit = Boolean(secondaryLabel && onSecondary);

  function handleContinue() {
    if (!canContinue || busy) return;
    if (showFinish && onFinish) return onFinish();
    return onNext?.();
  }

  return (
    <View
      style={[
        styles.bar,
        { paddingBottom: Math.max(insets.bottom, 16) + 8 },
        dark && styles.dark,
        hasSplit && styles.split,
      ]}>
      {hasSplit ? (
        <Button type="subtle" label={secondaryLabel} onPress={onSecondary} style={styles.flex} />
      ) : null}
      <Button
        type="primary"
        fullWidth={!hasSplit}
        style={hasSplit ? styles.flex : undefined}
        label={primaryLabel || (showFinish ? 'Finish' : 'Continue')}
        onPress={handleContinue}
        disabled={!canContinue || busy}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { paddingTop: 8, paddingHorizontal: 16, backgroundColor: colors.neutral.bg },
  dark: { backgroundColor: 'rgba(0,0,0,0.65)' },
  split: { flexDirection: 'row', gap: 8 },
  flex: { flex: 1 },
});
