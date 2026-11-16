import { View } from 'react-native';

import Placeholder from '@/components/Placeholder';
import { MainTopbar } from '@/components/navigation/Topbar';
import { useUser } from '@/context/UserContext';
import { colors } from '@/theme';

// TODO(phase 3): port pages/Home.jsx (feed)
export default function Home() {
  const { profile, role } = useUser();

  return (
    <View style={{ flex: 1, backgroundColor: colors.neutral.bg }}>
      <MainTopbar />
      <Placeholder
        edges={[]}
        title={`Hi ${profile?.full_name || profile?.username || ''}`.trim()}
        subtitle={`Signed in as ${role}. Feed — migrated in Phase 3`}
      />
    </View>
  );
}
