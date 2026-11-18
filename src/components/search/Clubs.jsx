import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import Badge from '@/components/ui/Badge';
import { colors, fonts } from '@/theme';

function Logo({ club, size }) {
  return club.logo_url ? (
    <Image source={{ uri: club.logo_url }} style={{ width: size, height: size }} contentFit="contain" accessibilityIgnoresInvertColors />
  ) : (
    <Text style={styles.initial}>{(club.name || '?')[0]}</Text>
  );
}

// Figma club bubble: logo in a blue-ringed circle, name, country.
export function ClubBubble({ club, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${club.name}${club.country ? `, ${club.country}` : ''}`}
      onPress={onPress}
      style={({ pressed }) => [styles.bubble, pressed && styles.pressed]}>
      <View style={styles.ring}>
        <Logo club={club} size={32} />
      </View>
      <Text style={styles.bubbleName} numberOfLines={1}>
        {club.name}
      </Text>
      {club.country ? <Text style={styles.bubbleCountry}>{club.country}</Text> : null}
    </Pressable>
  );
}

export function ClubBubbleRow({ clubs, onPressClub }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.bubbleRow}>
      {clubs.map((c) => (
        <ClubBubble key={c.id} club={c} onPress={() => onPressClub(c)} />
      ))}
    </ScrollView>
  );
}

// Figma "Near you" club row: logo, name + CLUB badge, country.
// (The design's bookmark is left out: there's nowhere to save clubs yet.)
export function ClubRow({ club, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${club.name}, club${club.country ? `, ${club.country}` : ''}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.rowLogo}>
        <Logo club={club} size={32} />
      </View>
      <View style={styles.rowInfo}>
        <View style={styles.rowTop}>
          <Text style={styles.rowName} numberOfLines={1}>
            {club.name}
          </Text>
          <Badge text="Club" />
        </View>
        {club.country || club.league ? (
          <Text style={styles.rowSub} numberOfLines={1}>
            {[club.country, club.league].filter(Boolean).join(' · ')}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.7 },
  initial: { fontFamily: fonts.semibold, fontSize: 16, color: colors.neutral[600] },

  bleed: { marginHorizontal: -16 },
  bubbleRow: { gap: 12, paddingHorizontal: 16, paddingVertical: 4 },
  bubble: { width: 96, alignItems: 'center', gap: 4, paddingHorizontal: 4 },
  ring: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary[500],
    backgroundColor: colors.white,
    boxShadow: '0 0 10px rgba(0,0,0,0.08)',
  },
  bubbleName: { fontFamily: fonts.semibold, fontSize: 14, color: colors.black, textAlign: 'center' },
  bubbleCountry: { fontFamily: fonts.medium, fontSize: 12, color: colors.neutral[700] },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 8,
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  rowLogo: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  rowInfo: { flex: 1, minWidth: 0, gap: 2 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowName: { fontFamily: fonts.semibold, fontSize: 16, color: colors.black, flexShrink: 1 },
  rowSub: { fontFamily: fonts.medium, fontSize: 14, color: colors.neutral[700] },
});
