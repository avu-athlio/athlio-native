import { Tabs } from 'expo-router';

import TabBar from '@/components/navigation/TabBar';
import { useUser } from '@/context/UserContext';
import { colors } from '@/theme';

// Home · Search · (Create) · Progress or Scouting · Profile.
// Athletes get Progress, professionals get Scout Tools — the other one is
// hidden with `href: null` (SDK 58 also redirects away from a hidden tab).
//
// Screens are declared in Expo Router's own sort order (shorter names first),
// not the visual order: a different order makes it dispatch ROUTE_NAMES_CHANGED
// ("was not handled by any navigator"). TabBar draws them in the visual order.
export default function TabsLayout() {
  const { isScout } = useUser();

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.neutral.bg },
      }}>
      <Tabs.Screen name="home" />
      <Tabs.Screen name="search" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="progress" options={{ href: isScout ? null : undefined }} />
      <Tabs.Screen name="scouting" options={{ href: isScout ? undefined : null }} />
    </Tabs>
  );
}
