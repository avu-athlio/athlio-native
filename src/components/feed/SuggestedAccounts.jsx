import { memo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import SuggestedFollowCard from '@/components/feed/SuggestedFollowCard';
import { colors, fonts } from '@/theme';

// "Suggested for you" horizontal row.
function SuggestedAccounts({ profiles, onOpenProfile }) {
  if (!profiles?.length) return null;

  return (
    <View style={styles.block}>
      <Text style={styles.title}>Suggested for you</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.list}>
        {profiles.map((p) => (
          <SuggestedFollowCard
            key={p.id}
            name={p.full_name || p.username}
            avatarUrl={p.avatar_url}
            verified={p.verified}
            position={p.position}
            // The web read `p.clubs?.name`, but the query returns `club`, so it never showed.
            clubName={p.club?.name || p.club_other_name || null}
            onPress={() => onOpenProfile(p.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

export default memo(SuggestedAccounts);

const styles = StyleSheet.create({
  block: { gap: 12, marginVertical: 16 },
  title: { fontFamily: fonts.medium, fontSize: 18, color: colors.black },
  list: { gap: 8 },
});
