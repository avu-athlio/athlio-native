import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing, type } from '@/theme';

// Temporary screen body used while screens are being migrated.
// Pass `edges={[]}` when the screen already renders a top bar / tab bar.
export default function Placeholder({ title, subtitle, children, edges }) {
  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      <View style={styles.container}>
        <Text style={[type['heading-4xl-italic'], styles.title]}>{title}</Text>
        {subtitle ? <Text style={[type['text-base-regular'], styles.subtitle]}>{subtitle}</Text> : null}
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.neutral.bg },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  title: { color: colors.black, textAlign: 'center' },
  subtitle: { color: colors.neutral[800], textAlign: 'center' },
});
