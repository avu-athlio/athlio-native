import { GearSix } from 'phosphor-react-native';
import { Pressable, Text, View } from 'react-native';

import Placeholder from '@/components/Placeholder';
import { PageTopbar } from '@/components/navigation/Topbar';
import IconButton from '@/components/ui/IconButton';
import { useUser } from '@/context/UserContext';
import { supabase } from '@/lib/supabase';
import { colors, type } from '@/theme';

// TODO: port pages/ProfileMe.jsx (cover photo, transparent top bar, settings)
export default function Profile() {
  const { profile } = useUser();

  return (
    <View style={{ flex: 1, backgroundColor: colors.neutral.bg }}>
      <PageTopbar
        showBack={false}
        right={<IconButton size="small" icon={GearSix} accessibilityLabel="Settings" />}
      />
      <Placeholder
        edges={[]}
        title={profile?.full_name || profile?.username || 'Profile'}
        subtitle={profile?.username ? `@${profile.username}` : undefined}>
        <Pressable accessibilityRole="button" onPress={() => supabase.auth.signOut()}>
          <Text style={[type['text-base-semibold'], { color: colors.negative.default }]}>Sign out</Text>
        </Pressable>
      </Placeholder>
    </View>
  );
}
