import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { ChallengesProvider } from '@/context/ChallengesContext';
import { ConnectedAppsProvider } from '@/context/ConnectedAppsContext';
import { SkillsProvider } from '@/context/SkillsContext';
import { TargetsProvider } from '@/context/TargetsContext';
import { UserProvider, useUser } from '@/context/UserContext';
import { colors, fontAssets } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <UserProvider>
      <ConnectedAppsProvider>
        <SkillsProvider>
          <ChallengesProvider>
            <TargetsProvider>
              <StatusBar style="dark" />
              <RootNavigator />
            </TargetsProvider>
          </ChallengesProvider>
        </SkillsProvider>
      </ConnectedAppsProvider>
    </UserProvider>
  );
}

function RootNavigator() {
  const { user, loading, profileLoading, isOnboarded } = useUser();

  // Keep the splash up until we know which group of screens to show.
  useEffect(() => {
    if (!loading) SplashScreen.hideAsync();
  }, [loading]);

  if (loading) return null;

  // Stay on the auth screens until the new user's profile has loaded, so we go
  // straight to onboarding or the app instead of flashing the wrong one.
  const signedIn = !!user && !profileLoading;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.neutral.bg },
      }}>
      {/* Signed out: intro + login/signup */}
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      {/* Signed in, profile not set up yet */}
      <Stack.Protected guard={signedIn && !isOnboarded}>
        <Stack.Screen name="setup-profile" />
      </Stack.Protected>

      {/* Signed in and onboarded: the main app */}
      <Stack.Protected guard={signedIn && isOnboarded}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
    </Stack>
  );
}
