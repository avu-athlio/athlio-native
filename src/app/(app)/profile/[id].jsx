import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import Placeholder from '@/components/Placeholder';
import { PageTopbar } from '@/components/navigation/Topbar';
import { getProfile } from '@/lib/profiles';
import { colors } from '@/theme';

// TODO: port pages/ProfileOther.jsx
export default function ProfileOther() {
  const { id } = useLocalSearchParams();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let alive = true;
    getProfile(id)
      .then((p) => alive && setProfile(p))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [id]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.neutral.bg }}>
      <PageTopbar />
      <Placeholder
        edges={['bottom']}
        title={profile?.full_name || profile?.username || 'Profile'}
        subtitle={profile?.username ? `@${profile.username} — full profile coming soon` : 'Coming soon'}
      />
    </View>
  );
}
