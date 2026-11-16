import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/theme';

// Port of the web MatchCard: "with picture" (photo + gradient, white text) and
// "without picture" variants. The compact "suggested" variant isn't used by
// the feed and comes with the screens that need it.

export default function MatchCard({
  imageUrl,
  yourTeam,
  yourTeamLogoUrl,
  yourScore,
  opponent,
  opponentLogoUrl,
  opponentScore,
  league,
  date,
  goalsCount,
  assistsCount,
  minCount,
  yellowCards = 0,
  redCards = 0,
}) {
  const stats = { goalsCount, assistsCount, minCount, yellowCards, redCards };

  if (imageUrl) {
    return (
      <View style={styles.card}>
        <View style={styles.pictureTop}>
          <Image source={{ uri: imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.86)']}
            locations={[0.18, 0.82]}
            start={{ x: 0.8, y: 0 }}
            end={{ x: 0.2, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Meta league={league} date={date} color={colors.white} />
          <View style={styles.pictureBottom}>
            <View style={styles.teams}>
              <TeamRow name={yourTeam} logoUrl={yourTeamLogoUrl} score={yourScore} nameColor={colors.white} scoreColor={colors.white} />
              <TeamRow name={opponent} logoUrl={opponentLogoUrl} score={opponentScore} nameColor={colors.white} scoreColor={colors.neutral[300]} />
            </View>
            <ResultBadge yourScore={yourScore} opponentScore={opponentScore} />
          </View>
        </View>
        <StatsRow {...stats} />
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.nopicTop}>
        <View style={styles.teams}>
          <TeamRow name={yourTeam} logoUrl={yourTeamLogoUrl} score={yourScore} nameColor={colors.black} scoreColor={colors.black} />
          <TeamRow name={opponent} logoUrl={opponentLogoUrl} score={opponentScore} nameColor={colors.muted} scoreColor={colors.muted} />
        </View>
        <View style={styles.nopicRight}>
          <Meta league={league} date={date} color={colors.black} />
          <ResultBadge yourScore={yourScore} opponentScore={opponentScore} />
        </View>
      </View>
      <StatsRow {...stats} />
    </View>
  );
}

function TeamIcon({ logoUrl, name }) {
  return (
    <View style={styles.teamIcon}>
      {logoUrl ? (
        <Image source={{ uri: logoUrl }} style={styles.fill} contentFit="contain" accessibilityLabel={name} />
      ) : (
        <Text style={styles.teamInitial}>{(name || '?')[0].toUpperCase()}</Text>
      )}
    </View>
  );
}

function TeamRow({ name, logoUrl, score, nameColor, scoreColor }) {
  return (
    <View style={styles.teamRow}>
      <TeamIcon logoUrl={logoUrl} name={name} />
      <Text style={[styles.teamName, { color: nameColor }]} numberOfLines={1}>
        {name}
      </Text>
      <Text style={[styles.score, { color: scoreColor }]}>{score}</Text>
    </View>
  );
}

function Meta({ league, date, color }) {
  return (
    <View style={styles.meta}>
      {league ? <Text style={[styles.metaLeague, { color }]}>{league}</Text> : null}
      {date ? <Text style={[styles.metaDate, { color }]}>{date}</Text> : null}
    </View>
  );
}

function ResultBadge({ yourScore, opponentScore }) {
  const a = Number(yourScore);
  const b = Number(opponentScore);
  const [label, bg, word] =
    a > b ? ['W', colors.success.default, 'Win'] : a < b ? ['L', colors.negative.default, 'Loss'] : ['D', '#a0a0a8', 'Draw'];
  return (
    <View style={[styles.result, { backgroundColor: bg }]} accessibilityLabel={word}>
      <Text style={styles.resultText}>{label}</Text>
    </View>
  );
}

function StatsRow({ goalsCount, assistsCount, minCount, yellowCards, redCards }) {
  const showCards = yellowCards > 0 || redCards > 0;
  return (
    <View style={styles.stats}>
      <Stat label="GOALS" value={goalsCount} />
      <Stat label="AST" value={assistsCount} />
      <Stat label="MIN." value={minCount} />
      {showCards ? (
        <View>
          <Text style={styles.statLabel}>CARDS</Text>
          <View style={styles.cards}>
            {Array.from({ length: yellowCards }).map((_, i) => (
              <View key={`y${i}`} style={[styles.bookCard, styles.yellow]} />
            ))}
            {Array.from({ length: redCards }).map((_, i) => (
              <View key={`r${i}`} style={[styles.bookCard, styles.red]} />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function Stat({ label, value }) {
  return (
    <View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value ?? 0}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  fill: { width: '100%', height: '100%' },

  pictureTop: { minHeight: 168, padding: 12, gap: 52, justifyContent: 'space-between' },
  pictureBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  nopicTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  nopicRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },

  teams: { gap: 8, flexShrink: 1 },
  teamRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  teamIcon: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  teamInitial: { fontFamily: fonts.bold, fontSize: 10, color: colors.neutral[600] },
  teamName: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 18, marginRight: 8, flexShrink: 1 },
  score: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 18 },

  meta: { alignItems: 'flex-end', alignSelf: 'flex-end', gap: 2 },
  metaLeague: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 13 },
  metaDate: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 13 },

  result: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  resultText: { fontFamily: fonts.medium, fontSize: 12, color: colors.white },

  stats: { flexDirection: 'row', alignItems: 'flex-start', gap: 48, padding: 16 },
  statLabel: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 13, color: colors.black },
  statValue: { fontFamily: fonts.condensedBoldItalic, fontSize: 32, lineHeight: 34, color: colors.neutral[950] },
  cards: { flexDirection: 'row', gap: 4, marginTop: 4 },
  bookCard: { width: 21, height: 23, borderRadius: 4 },
  yellow: { backgroundColor: '#ffc53d' },
  red: { backgroundColor: colors.negative.default },
});
