import { Plus } from 'phosphor-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { colors, fonts } from '@/theme';
import { positionAbbrs } from '@/utils/positions';

// Author row at the top of every post. Unlike the web, it never queries:
// the feed passes the avatar (already in the post query) and follow state.
export default function PostHeader({ name, avatarUrl, position, club, date, showFollow = false, onFollow, onOpenProfile }) {
  const abbr = positionAbbrs(position).join(' · ');
  const subtitle = abbr && club ? `${abbr} at @${club}` : abbr || club || '';

  return (
    <View style={styles.row}>
      <Pressable
        style={styles.left}
        onPress={onOpenProfile}
        accessibilityRole="link"
        accessibilityLabel={`${name}'s profile`}>
        <Avatar uri={avatarUrl} size="medium" verified />
        <View style={styles.text}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <View style={styles.sub}>
            {subtitle ? (
              <>
                <Text style={[styles.subText, styles.role]} numberOfLines={1}>
                  {subtitle}
                </Text>
                <View style={styles.dot} />
              </>
            ) : null}
            <Text style={styles.subText}>{date}</Text>
          </View>
        </View>
      </Pressable>

      {showFollow ? <Button size="small" type="primary" label="Follow" leadingIcon={Plus} onPress={onFollow} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'stretch', gap: 8 },
  left: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 },
  text: { gap: 2, flex: 1, minWidth: 0 },
  name: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 18, color: colors.black },
  sub: { flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 },
  subText: { fontFamily: fonts.medium, fontSize: 14, color: colors.muted },
  role: { flexShrink: 1 },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.muted },
});
