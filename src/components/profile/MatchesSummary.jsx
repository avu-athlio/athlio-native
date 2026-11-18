import { Image } from 'expo-image';
import { CaretDown } from 'phosphor-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { OptionSheet } from '@/components/compose/Pickers';
import { seasonStartYear } from '@/lib/profile-format';
import { colors, fonts } from '@/theme';

const MUTED = '#72717a';
const seasonTitle = (y) => `Season ${y}/${String(y + 1).slice(2)}`;

const CARDS = [
  { key: 'matches', label: 'Matches', icon: require('@/assets/images/profile/stat-matches.svg'), box: { right: -6, top: 56, width: 44.1, height: 35.9 } },
  { key: 'goals', label: 'Goals', icon: require('@/assets/images/profile/stat-goals.svg'), box: { right: -7, top: 48, width: 49, height: 49 } },
  { key: 'assists', label: 'Assist', icon: require('@/assets/images/profile/stat-assists.svg'), box: { right: -3, top: 52, width: 39.2, height: 41.7 } },
];

/**
 * Figma "Others Profile - matches": "Performance" with a season picker and
 * Matches / Goals / Assist cards for the shown matches. `season` is a start
 * year or 'all'; `seasons` are the years with matches, newest first.
 */
export default function MatchesSummary({ matches, seasons, season, onChangeSeason }) {
  const [open, setOpen] = useState(false);
  const totals = {
    matches: matches.length,
    goals: matches.reduce((t, m) => t + (Number(m.goals) || 0), 0),
    assists: matches.reduce((t, m) => t + (Number(m.assists) || 0), 0),
  };
  const current = seasonStartYear(new Date());
  const sub = season === 'all' ? 'all seasons' : season === current ? 'this season' : `in ${season}/${String(season + 1).slice(2)}`;
  const options = [
    ...seasons.map((y) => ({ value: y, label: seasonTitle(y) })),
    { value: 'all', label: 'All seasons' },
  ];

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={styles.title} accessibilityRole="header">
          Performance
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${season === 'all' ? 'All seasons' : seasonTitle(season)}, change season`}
          onPress={() => setOpen(true)}
          hitSlop={6}
          style={styles.picker}>
          <Text style={styles.pickerText}>{season === 'all' ? 'All seasons' : seasonTitle(season)}</Text>
          <CaretDown size={18} color={colors.primary.default} />
        </Pressable>
      </View>

      <View style={styles.cards}>
        {CARDS.map((c) => (
          <View key={c.key} style={styles.card} accessible accessibilityLabel={`${c.label}: ${totals[c.key]} ${sub}`}>
            <Image source={c.icon} style={[styles.icon, c.box]} />
            <Text style={styles.label}>{c.label}</Text>
            <Text style={styles.value}>{totals[c.key]}</Text>
            <Text style={styles.sub}>{sub}</Text>
          </View>
        ))}
      </View>

      <OptionSheet
        visible={open}
        title="Pick the season"
        options={options}
        value={season}
        onSelect={(v) => {
          onChangeSeason(v);
          setOpen(false);
        }}
        onClose={() => setOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12, paddingHorizontal: 16, paddingTop: 4, paddingBottom: 12 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: fonts.semibold, fontSize: 16, color: colors.black },
  picker: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 32, paddingHorizontal: 8 },
  pickerText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.primary.default },
  cards: { flexDirection: 'row', gap: 8 },
  card: {
    flex: 1,
    alignItems: 'center',
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 6,
    borderRadius: 12,
    backgroundColor: colors.white,
    boxShadow: '0 0 21px rgba(0,0,0,0.08)',
  },
  icon: { position: 'absolute' },
  label: { fontFamily: fonts.medium, fontSize: 14, color: colors.black, textTransform: 'uppercase' },
  value: { fontFamily: fonts.condensedBoldItalic, fontSize: 44, lineHeight: 48, color: colors.black },
  sub: { fontFamily: fonts.medium, fontSize: 12, color: MUTED },
});
