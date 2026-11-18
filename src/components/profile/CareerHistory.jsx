import { Image } from 'expo-image';
import { CourtBasketball, SoccerBall } from 'phosphor-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { experienceDates } from '@/lib/profile-format';
import { colors, fonts } from '@/theme';

// Port of the web CareerHistory: clubs with dates, matches and goals.
// The current club comes first if it isn't already an experience.
export default function CareerHistory({ club, experiences }) {
  const rows = [];
  const hasCurrent = experiences.some((e) => e.is_current && e.club?.name === club?.name);
  if (club?.name && !hasCurrent) {
    rows.push({ id: 'current', logo: club.logo_url, name: club.name, league: club.league, date: 'Present' });
  }
  for (const exp of experiences) {
    rows.push({
      id: exp.id,
      logo: exp.club?.logo_url,
      name: exp.club?.name || '—',
      league: exp.club?.league,
      matches: exp.matches_played,
      goals: exp.goals_scored,
      date: experienceDates(exp).filter(Boolean).join(' '),
    });
  }

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          Career history
        </Text>
        <View style={styles.icons}>
          <CourtBasketball size={22} weight="light" color={colors.neutral[500]} />
          <SoccerBall size={22} weight="light" color={colors.neutral[500]} />
        </View>
      </View>

      {rows.length === 0 ? (
        <Text style={styles.empty}>No career history yet.</Text>
      ) : (
        <View style={styles.list}>
          {rows.map((row, i) => (
            <View key={row.id} style={[styles.row, i < rows.length - 1 && styles.rowBorder]}>
              <ClubLogo url={row.logo} name={row.name} size={32} />
              <View style={styles.info}>
                <View style={styles.nameRow}>
                  <Text style={styles.name} numberOfLines={1}>
                    {row.name}
                  </Text>
                  {row.league ? (
                    <>
                      <View style={styles.dot} />
                      <Text style={styles.name} numberOfLines={1}>
                        {row.league}
                      </Text>
                    </>
                  ) : null}
                </View>
                <Text style={styles.date}>{row.date}</Text>
              </View>
              <View style={styles.stats} accessibilityLabel={`${row.matches ?? 0} matches, ${row.goals ?? 0} goals`}>
                <Text style={styles.stat}>{row.matches ?? '–'}</Text>
                <Text style={styles.stat}>{row.goals ?? '–'}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export function ClubLogo({ url, name, size }) {
  const box = { width: size, height: size, borderRadius: 4 };
  if (url) return <Image source={{ uri: url }} style={box} contentFit="contain" />;
  return (
    <View style={[box, styles.fallback]}>
      <Text style={styles.fallbackText}>{name?.charAt(0) || '?'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: fonts.semibold, fontSize: 18, color: colors.black },
  icons: { flexDirection: 'row', gap: 8 },
  list: { backgroundColor: colors.white, borderRadius: 12, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.neutral[200] },
  info: { flex: 1, minWidth: 0, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontFamily: fonts.medium, fontSize: 14, color: colors.black, flexShrink: 1 },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.neutral[500] },
  date: { fontFamily: fonts.regular, fontSize: 12, color: colors.neutral[600] },
  stats: { flexDirection: 'row', gap: 16 },
  stat: { width: 24, textAlign: 'right', fontFamily: fonts.regular, fontSize: 14, color: colors.neutral[700] },
  empty: { fontFamily: fonts.regular, fontSize: 14, color: colors.neutral[600] },
  fallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.neutral[200] },
  fallbackText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.neutral[600] },
});
