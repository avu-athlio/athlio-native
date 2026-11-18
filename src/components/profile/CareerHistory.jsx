import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { experienceDates, flagEmoji } from '@/lib/profile-format';
import { colors, fonts } from '@/theme';

const MUTED = '#72717a';
const PITCH = require('@/assets/images/profile/pitch.svg');
const FOOTBALL = require('@/assets/images/profile/football.svg');
const SHADOW = { boxShadow: '0 0 21px rgba(0,0,0,0.08)' };

const PitchIcon = () => (
  <View style={styles.iconBox}>
    <Image source={PITCH} style={styles.pitch} />
  </View>
);
const FootballIcon = () => <Image source={FOOTBALL} style={styles.icon24} />;

/**
 * Figma history list (Career history / National team history): logo, name,
 * "From Jul 2024 to Present", then matches and goals columns.
 */
function HistoryList({ title, rows, empty }) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        <View style={styles.headIcons} accessibilityLabel="Columns: matches, goals">
          <PitchIcon />
          <FootballIcon />
        </View>
      </View>

      {rows.length === 0 ? (
        <Text style={styles.empty}>{empty}</Text>
      ) : (
        <View style={styles.list}>
          {rows.map((row, i) => (
            <View
              key={row.id}
              style={[styles.row, i < rows.length - 1 && styles.rowBorder]}
              accessible
              accessibilityLabel={`${row.name}, ${row.date}, ${row.matches ?? 0} matches, ${row.goals ?? 0} goals`}>
              <View style={styles.logo}>{row.logo}</View>
              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>
                  {row.name}
                </Text>
                <Text style={styles.date} numberOfLines={1}>
                  {row.date}
                </Text>
              </View>
              <View style={styles.stats}>
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

const dates = (row) => experienceDates(row).filter(Boolean).join(' ');

const norm = (s) => (s ?? '').trim().toLowerCase();

// Matches logged after games (Add match) for a club: same team name, and
// from `since` on when the club entry has a start date.
function logged(matches, clubName, since) {
  const name = norm(clubName);
  if (!name) return { matches: 0, goals: 0 };
  const rows = matches.filter((m) => norm(m.your_team) === name && (!since || m.date_of_game >= since));
  return { matches: rows.length, goals: rows.reduce((t, m) => t + (Number(m.goals) || 0), 0) };
}

/**
 * Clubs with dates, matches and goals. The current club comes first if it
 * isn't already an experience. For the current club, the matches logged
 * after games are counted in (on top of any numbers typed into the entry,
 * which are meant for games from before using Athlio).
 */
export default function CareerHistory({ club, experiences, matches = [] }) {
  const rows = [];
  const hasCurrent = experiences.some((e) => e.is_current && norm(e.club?.name) === norm(club?.name));
  if (club?.name && !hasCurrent) {
    const l = logged(matches, club.name);
    rows.push({
      id: 'current',
      logo: <ClubLogo url={club.logo_url} name={club.name} size={24} />,
      name: club.name,
      date: 'Present',
      matches: l.matches,
      goals: l.goals,
    });
  }
  for (const exp of experiences) {
    const l = exp.is_current ? logged(matches, exp.club?.name, exp.start_date) : { matches: 0, goals: 0 };
    rows.push({
      id: exp.id,
      logo: <ClubLogo url={exp.club?.logo_url} name={exp.club?.name} size={24} />,
      name: exp.club?.name || '—',
      matches: (exp.matches_played ?? 0) + l.matches,
      goals: (exp.goals_scored ?? 0) + l.goals,
      date: dates(exp),
    });
  }
  return <HistoryList title="Career history" rows={rows} empty="No career history yet." />;
}

export function NationalTeamHistory({ teams }) {
  const rows = teams.map((t) => ({
    id: t.id,
    logo: <Text style={styles.flag}>{flagEmoji(t.country_code) ?? '🏳️'}</Text>,
    name: t.team_name,
    matches: t.matches_played,
    goals: t.goals_scored,
    date: dates(t),
  }));
  return <HistoryList title="National team history" rows={rows} empty="No national team history yet." />;
}

/** The "Matches · Goals" key under the lists. */
export function HistoryLegend() {
  return (
    <View style={styles.legend}>
      <View style={styles.legendItem}>
        <PitchIcon />
        <Text style={styles.legendText}>Matches</Text>
      </View>
      <View style={styles.legendItem}>
        <FootballIcon />
        <Text style={styles.legendText}>Goals</Text>
      </View>
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
  section: { gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: fonts.semibold, fontSize: 16, color: colors.black },
  headIcons: { flexDirection: 'row', gap: 16, paddingRight: 12 },
  iconBox: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  pitch: { width: 21.5, height: 17.5 },
  icon24: { width: 24, height: 24 },
  list: { backgroundColor: colors.white, borderRadius: 12, ...SHADOW },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 59, padding: 10 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.neutral[200] },
  logo: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  flag: { fontSize: 20, lineHeight: 24 },
  info: { flex: 1, minWidth: 0, gap: 3 },
  name: { fontFamily: fonts.medium, fontSize: 14, color: colors.black },
  date: { fontFamily: fonts.medium, fontSize: 12, color: MUTED },
  stats: { flexDirection: 'row', gap: 16, paddingRight: 2 },
  stat: { width: 24, textAlign: 'center', fontFamily: fonts.semibold, fontSize: 12, lineHeight: 12, color: MUTED },
  empty: { fontFamily: fonts.regular, fontSize: 14, color: colors.neutral[600] },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 24 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendText: { fontFamily: fonts.medium, fontSize: 16, color: MUTED },
  fallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.neutral[200] },
  fallbackText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.neutral[600] },
});
