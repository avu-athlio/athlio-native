import { View } from 'react-native';

import Feed from '@/components/feed/Feed';
import { MainTopbar } from '@/components/navigation/Topbar';
import { colors } from '@/theme';

export default function Home() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.neutral.bg }}>
      <MainTopbar />
      <Feed />
    </View>
  );
}
