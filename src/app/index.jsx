import { Redirect } from 'expo-router';

import { useUser } from '@/context/UserContext';
import { hasSeenIntro } from '@/lib/intro';

// Entry route: send the user to the right place for their auth state.
export default function Index() {
  const { user, isOnboarded } = useUser();

  if (!user) return <Redirect href={hasSeenIntro() ? '/auth' : '/intro'} />;
  if (!isOnboarded) return <Redirect href="/setup-profile" />;
  return <Redirect href="/home" />;
}
