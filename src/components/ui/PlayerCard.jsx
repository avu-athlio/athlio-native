import { Image } from 'expo-image';
import { Check } from 'phosphor-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import { colors, fonts } from '@/theme';
import { positionAbbrs } from '@/utils/positions';
import { isProfessional } from '@/utils/roles';

// Port of the web PlayerCard ("club" info type): avatar, name + positions,
// club logo · club · country, and Follow / ✓ on the right.
export default function PlayerCard({ profile, isFollowing = false, onFollow, onPress, showAction = true }) {
  if (!profile) return null;

  const pro = isProfessional(profile.role);
  const positions = positionAbbrs(profile.position).slice(0, 2);
  const club = profile.club;
  const name = profile.full_name || profile.username || '';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <Avatar uri={profile.avatar_url} size="medium" verified={profile.verified} />

      <View style={styles.info}>
        <View style={styles.top}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          {pro && profile.role ? (
            <Badge text={profile.role} />
          ) : (
            positions.map((p) => <Badge key={p} text={p} />)
          )}
        </View>
        {club?.name ? (
          <View style={styles.sub}>
            {club.logo_url ? <Image source={{ uri: club.logo_url }} style={styles.logo} contentFit="contain" /> : null}
            <Text style={styles.subText} numberOfLines={1}>
              {club.name}
            </Text>
            {club.country ? (
              <>
                <View style={styles.dot} />
                <Text style={styles.subText} numberOfLines={1}>
                  {club.country}
                </Text>
              </>
            ) : null}
          </View>
        ) : null}
      </View>

      {showAction ? (
        isFollowing ? (
          <IconButton icon={Check} size="small" type="subtle" onPress={onFollow} accessibilityLabel={`Unfollow ${name}`} />
        ) : (
          <Button size="small" type="primary" label="Follow" onPress={onFollow} />
        )
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
  },
  pressed: { opacity: 0.7 },
  info: { flex: 1, minWidth: 0, gap: 4 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  name: { fontFamily: fonts.semibold, fontSize: 16, color: colors.black, flexShrink: 1 },
  sub: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  logo: { width: 16, height: 16 },
  subText: { fontFamily: fonts.regular, fontSize: 14, color: colors.neutral[600], flexShrink: 1 },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.neutral[400] },
});
