import { View } from 'react-native';

import Placeholder from '@/components/Placeholder';
import { PageTopbar } from '@/components/navigation/Topbar';
import { colors } from '@/theme';

// TODO: port pages/Chat.jsx (search field in the top bar, chat list)
export default function Chat() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.neutral.bg }}>
      <PageTopbar title="Messages" />
      <Placeholder edges={['bottom']} title="Messages" subtitle="Coming soon" />
    </View>
  );
}
