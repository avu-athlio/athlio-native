import { Pressable, StyleSheet, Text, View } from 'react-native';

import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { colors, fonts } from '@/theme';
import { positionAbbrs } from '@/utils/positions';

// Port of the web SuggestedFollowCard: photo, up to two position badges,
// first name + LAST NAME, club. Tapping opens the profile.
export default function SuggestedFollowCard({ name, avatarUrl, verified = false, position, clubName, onPress }) {
  const parts = (name || '').trim().split(' ');
  const firstName = parts[0] || '';
  const lastName = parts.slice(1).join(' ');
  const badges = positionAbbrs(position).slice(0, 2);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={`${name}'s profile`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.photoWrap}>
        <Avatar uri={avatarUrl} size="large" verified={verified} />
        {badges.length ? (
          <View style={styles.badges}>
            {badges.map((b) => (
              <Badge key={b} text={b} />
            ))}
          </View>
        ) : null}
      </View>
      <View style={styles.info}>
        <Text style={styles.first} numberOfLines={1}>
          {firstName}
        </Text>
        {lastName ? (
          <Text style={styles.last} numberOfLines={1}>
            {lastName}
          </Text>
        ) : null}
        {clubName ? (
          <Text style={styles.club} numberOfLines={1}>
            {clubName}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 110,
    alignItems: 'center',
    paddingTop: 12,
    paddingHorizontal: 8,
    paddingBottom: 10,
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  pressed: { opacity: 0.7 },
  photoWrap: { alignItems: 'center', marginBottom: 4 },
  badges: { position: 'absolute', bottom: -8, flexDirection: 'row', gap: 4 },
  info: { paddingTop: 16, alignItems: 'center', alignSelf: 'stretch' },
  first: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 17, color: colors.black },
  last: {
    fontFamily: fonts.condensedBoldItalic,
    fontSize: 18,
    lineHeight: 20,
    textTransform: 'uppercase',
    color: colors.black,
  },
  club: { marginTop: 4, fontFamily: fonts.regular, fontSize: 12, color: colors.neutral[600] },
});
