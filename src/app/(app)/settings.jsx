import { SignOut } from 'phosphor-react-native';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { PageTopbar } from '@/components/navigation/Topbar';
import { supabase } from '@/lib/supabase';
import { colors, fonts } from '@/theme';

// The web gear icon did nothing yet; for now Settings holds Sign out
// (moved off the Profile placeholder).
export default function Settings() {
  const signOut = () =>
    Alert.alert('Sign out?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => supabase.auth.signOut() },
    ]);

  return (
    <View style={styles.screen}>
      <PageTopbar title="Settings" />
      <View style={styles.body}>
        <Pressable
          accessibilityRole="button"
          onPress={signOut}
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
          <SignOut size={20} color={colors.negative.default} />
          <Text style={styles.signOut}>Sign out</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.neutral.bg },
  body: { padding: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  pressed: { opacity: 0.7 },
  signOut: { fontFamily: fonts.semibold, fontSize: 16, color: colors.negative.default },
});
