import { useLocalSearchParams } from 'expo-router';

import ProfileScreen from '@/components/profile/ProfileScreen';

// Someone else's profile (web /profile/:id), pushed over the tabs.
export default function OtherProfile() {
  const { id } = useLocalSearchParams();
  return <ProfileScreen profileId={Array.isArray(id) ? id[0] : id} showBack />;
}
