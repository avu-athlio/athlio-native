import { Image } from 'expo-image';
import { PencilSimple, Plus, ShareNetwork } from 'phosphor-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TOPBAR_CONTENT_HEIGHT } from '@/components/navigation/Topbar';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { colors, fonts, type } from '@/theme';
import { positionAbbrs } from '@/utils/positions';
import { isProfessional } from '@/utils/roles';

const stripes = require('@/assets/images/darkblue-stripes.png');

// Port of the web ProfileHeader: dark-blue striped card with avatar, name,
// followers, position/role badges and club, then Edit + Share (me) or
// Follow + Message (others). The transparent top bar floats over it.
export default function ProfileHeader({
  profile,
  isMe,
  following,
  followBusy,
  onToggleFollow,
  onMessage,
  onEdit,
  onShare,
  onAvatarPress,
  onOpenFollowing,
}) {
  const insets = useSafeAreaInsets();
  const pro = isProfessional(profile.role);
  const positions = positionAbbrs(profile.position).slice(0, 3);
  const club = profile.club;
  const hasBadge = pro ? !!profile.role : positions.length > 0;
  const name = profile.full_name || profile.username || 'Athlete';

  const avatar = <Avatar uri={profile.avatar_url} size="xlarge" verified={profile.verified} />;

  return (
    <View style={[styles.root, { paddingTop: insets.top + TOPBAR_CONTENT_HEIGHT + 8 }]}>
      <Image source={stripes} style={StyleSheet.absoluteFill} contentFit="cover" />

      <View style={styles.content}>
        {isMe ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={profile.avatar_url ? 'Change profile picture' : 'Add profile picture'}
            onPress={onAvatarPress}>
            {avatar}
          </Pressable>
        ) : (
          avatar
        )}

        <View style={styles.info}>
          <Text style={styles.name} accessibilityRole="header">
            {name}
          </Text>
          <Text style={styles.followers}>
            {formatCount(profile.follower_count)} followers
            {isMe ? (
              <>
                {' · '}
                <Text accessibilityRole="link" onPress={onOpenFollowing} suppressHighlighting={false}>
                  {formatCount(profile.following_count)} following
                </Text>
              </>
            ) : null}
          </Text>
          <View style={styles.metaRow}>
            {pro && profile.role ? (
              <Badge text={profile.role} size="sm" />
            ) : (
              positions.map((p) => <Badge key={p} text={p} size="sm" />)
            )}
            {hasBadge && club?.name ? <View style={styles.dot} /> : null}
            {club?.name ? (
              <View style={styles.club}>
                {club.logo_url ? (
                  <Image source={{ uri: club.logo_url }} style={styles.clubLogo} contentFit="contain" />
                ) : null}
                <Text style={styles.clubName} numberOfLines={1}>
                  {club.name}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        {isMe ? (
          <>
            <Button size="small" type="secondary" label="Edit Profile" leadingIcon={PencilSimple} onPress={onEdit} style={styles.action} />
            <Button size="small" type="white" label="Share" leadingIcon={ShareNetwork} onPress={onShare} style={styles.action} />
          </>
        ) : (
          <>
            <Button
              size="small"
              type={following ? 'following' : 'secondary'}
              label={following ? 'Following' : 'Follow'}
              leadingIcon={following ? undefined : Plus}
              disabled={followBusy}
              onPress={onToggleFollow}
              style={styles.action}
            />
            <Button size="small" type="white" label="Message" onPress={onMessage} style={styles.action} />
          </>
        )}
      </View>
    </View>
  );
}

const formatCount = (n) => (Number(n) || 0).toLocaleString('en-GB');

const styles = StyleSheet.create({
  root: {
    minHeight: 222,
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    backgroundColor: colors.primary[900],
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: 17 },
  info: { flex: 1, minWidth: 0, gap: 8 },
  name: { ...type['heading-4xl-italic'], lineHeight: 32, color: colors.white },
  followers: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 16, color: colors.neutral[300] },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.neutral[300] },
  club: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
  clubLogo: { width: 20, height: 20 },
  clubName: { fontFamily: fonts.medium, fontSize: 14, color: colors.white, flexShrink: 1 },
  actions: { flexDirection: 'row', gap: 10 },
  action: { flex: 1 },
});
