import { Stack } from 'expo-router';

import { colors } from '@/theme';

// Signed-in app: the tab shell, plus full-screen pages pushed over it (no tab bar).
export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.neutral.bg },
      }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="chat" />
      <Stack.Screen name="add-post" />
      <Stack.Screen name="add-match" />
    </Stack>
  );
}
