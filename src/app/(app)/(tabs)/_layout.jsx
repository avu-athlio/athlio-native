import { Tabs } from 'expo-router';

import TabBar from '@/components/navigation/TabBar';
import { useUser } from '@/context/UserContext';
import { colors } from '@/theme';

// Home · Search · (Create) · Progress or Scouting · Profile.
// Athletes get Progress, professionals get Scout Tools — the other one is
// hidden with `href: null` (SDK 58 also redirects away from a hidden tab).
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
      <Tabs.Screen name="progress" options={{ href: isScout ? null : undefined }} />
      <Tabs.Screen name="scouting" options={{ href: isScout ? undefined : null }} />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
