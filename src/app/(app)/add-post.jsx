import { useLocalSearchParams } from 'expo-router';
import { X } from 'phosphor-react-native';
import { View } from 'react-native';

import Placeholder from '@/components/Placeholder';
import { PageTopbar } from '@/components/navigation/Topbar';
import { colors } from '@/theme';

// TODO: port pages/AddPost.jsx (Composer)
export default function AddPost() {
  const { type = 'post' } = useLocalSearchParams();

  return (
    <View style={{ flex: 1, backgroundColor: colors.neutral.bg }}>
      <PageTopbar title="New post" backIcon={X} />
      <Placeholder edges={['bottom']} title="New post" subtitle={`Composer (${type}) — coming soon`} />
    </View>
  );
}
