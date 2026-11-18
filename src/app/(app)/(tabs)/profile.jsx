import ProfileScreen from '@/components/profile/ProfileScreen';
import { useUser } from '@/context/UserContext';

// My profile (web /profile/me). Sign out moved to Settings (gear).
export default function MyProfile() {
  const { user } = useUser();
  return <ProfileScreen profileId={user?.id} />;
}
