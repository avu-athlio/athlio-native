import { Stack } from 'expo-router';

import { colors } from '@/theme';

// Signed-in app: the (tabs) shell, plus full-screen pages pushed over it
// (notifications, chat, add-post, add-match, profile/[id]) without a tab bar.
//
// Screens are deliberately not listed: Expo Router seeds navigator state with
// routes in its own sorted order, and a different declared order makes it
// dispatch ROUTE_NAMES_CHANGED, which logs "was not handled by any navigator".
export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.neutral.bg },
      }}
    />
  );
}
