import { Stack } from 'expo-router';

import { colors } from '@/theme';

// Composer entry screens slide up from the bottom and back down when closed
// (swipe down also closes them on iOS). Steps inside a flow, like
// post-about-match/[matchId], keep the normal sideways push.
const SLIDE_UP = new Set([
  'add-post',
  'add-match',
  'add-training',
  'post-about-match/index',
  'post-about-training/index',
]);

// Signed-in app: the (tabs) shell, plus full-screen pages pushed over it
// (notifications, chat, add-post, add-match, profile/[id]) without a tab bar.
//
// Screens are deliberately not listed: Expo Router seeds navigator state with
// routes in its own sorted order, and a different declared order makes it
// dispatch ROUTE_NAMES_CHANGED, which logs "was not handled by any navigator".
// Per-screen options are picked by route name in `screenOptions` instead.
export default function AppLayout() {
  return (
    <Stack
      screenOptions={({ route }) => ({
        headerShown: false,
        contentStyle: { backgroundColor: colors.neutral.bg },
        ...(SLIDE_UP.has(route.name) ? { animation: 'slide_from_bottom', gestureDirection: 'vertical' } : null),
      })}
    />
  );
}
