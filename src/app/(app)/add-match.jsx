import { X } from 'phosphor-react-native';
import { View } from 'react-native';

import Placeholder from '@/components/Placeholder';
import { PageTopbar } from '@/components/navigation/Topbar';
import { colors } from '@/theme';

// TODO: port pages/AddMatch.jsx
export default function AddMatch() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.neutral.bg }}>
      <PageTopbar title="Add match" backIcon={X} />
      <Placeholder edges={['bottom']} title="Add match" subtitle="Coming soon" />
    </View>
  );
}
