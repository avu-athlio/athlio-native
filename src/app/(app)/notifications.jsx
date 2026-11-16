import { View } from 'react-native';

import Placeholder from '@/components/Placeholder';
import { MainTopbar } from '@/components/navigation/Topbar';
import { colors } from '@/theme';

// TODO: port pages/Notifications.jsx (also sets counts.notifications)
export default function Notifications() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.neutral.bg }}>
      <MainTopbar showBack showActions={false} />
      <Placeholder edges={['bottom']} title="Notifications" subtitle="Coming soon" />
    </View>
  );
}
