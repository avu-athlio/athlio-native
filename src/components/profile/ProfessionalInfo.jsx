import { Plus } from 'phosphor-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ClubLogo } from '@/components/profile/CareerHistory';
import { experienceDates } from '@/lib/profile-format';
import { colors, fonts } from '@/theme';

const ABOUT_MAX_CHARS = 140;

// Port of the web ProfessionalInfoTab: About (bio, "See more") + Experiences.
// Live experiences rows point at a club (no org/team name columns), so the
// card shows club + league; the current club shows with the role.
export default function ProfessionalInfo({ profile, experiences, isMe, onEdit }) {
  const [expanded, setExpanded] = useState(false);
  const bio = profile.bio || '';
  const long = bio.length > ABOUT_MAX_CHARS;
  const shownBio = long && !expanded ? `${bio.slice(0, ABOUT_MAX_CHARS)}…` : bio;

  const club = profile.club;
  const role = profile.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : null;
  const hasCurrent = experiences.some((e) => e.is_current && e.club?.name === club?.name);
  const cards = [
    ...(club?.name && !hasCurrent
      ? [{ id: 'current', title: role || club.name, sub: club.name, logo: club.logo_url, exp: { is_current: true } }]
      : []),
    ...experiences.map((e) => ({ id: e.id, title: e.club?.name || '—', sub: e.club?.league, logo: e.club?.logo_url, exp: e })),
  ];

  return (
    <View style={styles.root}>
      <View style={styles.section}>
        <Text style={styles.title} accessibilityRole="header">
          About
        </Text>
        {bio ? (
          <View style={styles.card}>
            <Text style={styles.bio}>{shownBio}</Text>
            {long ? (
              <Pressable accessibilityRole="button" onPress={() => setExpanded((v) => !v)} hitSlop={6}>
                <Text style={styles.link}>{expanded ? 'See less' : 'See more'}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : isMe ? (
          <Pressable accessibilityRole="button" onPress={onEdit} style={[styles.card, styles.emptyCard]}>
            <Plus size={16} weight="bold" color={colors.primary.default} />
            <Text style={styles.link}>Add about</Text>
          </Pressable>
        ) : (
          <Text style={styles.muted}>No bio yet.</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.title} accessibilityRole="header">
          Experiences
        </Text>
        {cards.length ? (
          cards.map((c) => {
            const [line1, line2] = experienceDates(c.exp);
            return (
              <View key={c.id} style={[styles.card, styles.expCard]}>
                <View style={styles.expLeft}>
                  <ClubLogo url={c.logo} name={c.title} size={24} />
                  <View style={styles.expInfo}>
                    <Text style={styles.expTitle} numberOfLines={1}>
                      {c.title}
                    </Text>
                    {c.sub ? (
                      <Text style={styles.expSub} numberOfLines={1}>
                        {c.sub}
                      </Text>
                    ) : null}
                  </View>
                </View>
                <View style={styles.expDate}>
                  {line1 && line1 !== '—' ? <Text style={styles.dateText}>{line1}</Text> : null}
                  {line2 ? <Text style={styles.dateText}>{line2}</Text> : null}
                </View>
              </View>
            );
          })
        ) : (
          <Text style={styles.muted}>No experiences yet.</Text>
        )}
      </View>
    </View>
  );
}

const shadow = '0 0 10.5px rgba(0,0,0,0.08)';

const styles = StyleSheet.create({
  root: { gap: 16 },
  section: { gap: 8 },
  title: { fontFamily: fonts.semibold, fontSize: 18, color: colors.black },
  card: { backgroundColor: colors.white, borderRadius: 8, boxShadow: shadow, padding: 12, gap: 2 },
  bio: { fontFamily: fonts.medium, fontSize: 14, color: colors.black },
  link: { fontFamily: fonts.semibold, fontSize: 14, color: colors.primary.default },
  emptyCard: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  muted: { fontFamily: fonts.regular, fontSize: 14, color: colors.neutral[600] },
  expCard: { padding: 10, minHeight: 59, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  expLeft: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8 },
  expInfo: { flexShrink: 1 },
  expTitle: { fontFamily: fonts.medium, fontSize: 14, color: colors.black },
  expSub: { fontFamily: fonts.medium, fontSize: 12, color: colors.muted },
  expDate: { alignItems: 'flex-end', marginLeft: 8 },
  dateText: { fontFamily: fonts.medium, fontSize: 10, color: colors.muted },
});
