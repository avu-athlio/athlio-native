import { LinearGradient } from 'expo-linear-gradient';
import { Heartbeat, PersonSimpleRun, UsersThree } from 'phosphor-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { formatPostDate } from '@/lib/format';
import { colors, fonts } from '@/theme';

const ICONS = { individual: PersonSimpleRun, team: UsersThree, recovery: Heartbeat };

// Third stat: what kind of session it was (RUN, GYM…) or, for team, its focus.
function thirdStat(t) {
  if (t.type === 'team') return t.focus ? ['FOCUS', abbreviate(t.focus)] : null;
  return t.activity ? ['TYPE', abbreviate(t.activity)] : null;
}
const abbreviate = (s) => (s.length > 5 ? s.slice(0, 3) : s).toUpperCase();

/**
 * Figma training card. `training` comes from readTraining().
 * Default: header (gradient icon, "Individual Training", date) over a stats row
 * (DUR. / EFFORT / TYPE). `compact`: the small card in the Post about training grid.
 * `bordered`: thin outline, for the feed.
 */
export default function TrainingCard({ training: t, compact = false, bordered = false }) {
  if (!t) return null;
  const Icon = ICONS[t.type] ?? PersonSimpleRun;
  const date = formatPostDate(t.date);
  const third = thirdStat(t);

  if (compact) {
    return (
      <View style={styles.compact}>
        <View style={styles.compactTop}>
          <View style={styles.compactIcon}>
            <Icon size={18} color={colors.primary.default} />
          </View>
          <View style={styles.meta}>
            <Text style={styles.metaText}>Training</Text>
            <Text style={styles.metaText}>{date}</Text>
          </View>
        </View>
        <View>
          <Text style={[styles.compactTitle, styles.compactKind]}>{t.label}</Text>
          <Text style={styles.compactTitle}>Training</Text>
        </View>
        <View style={styles.compactStats}>
          <Stat label="DUR" value={t.duration} compact />
          {t.effort != null ? <Stat label="EFFORT" value={t.effort} compact /> : null}
          {third ? <Stat label={third[0]} value={third[1]} compact /> : null}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.card, bordered && styles.bordered]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <LinearGradient
            colors={['#33f578', '#e7fc6f']}
            start={{ x: 0, y: 0.6 }}
            end={{ x: 1, y: 0.4 }}
            style={styles.icon}>
            <Icon size={16} color={colors.black} />
          </LinearGradient>
          <Text style={styles.title} numberOfLines={1}>
            {t.label} Training
          </Text>
        </View>
        <View style={styles.meta}>
          <Text style={styles.metaText}>Training</Text>
          <Text style={styles.metaText}>{date}</Text>
        </View>
      </View>
      <View style={styles.stats}>
        <Stat label="DUR." value={t.duration} unit="min" />
        {t.effort != null ? <Stat label="EFFORT" value={t.effort} unit="/10" /> : null}
        {third ? <Stat label={third[0]} value={third[1]} /> : null}
      </View>
      {t.description ? <Text style={styles.description}>{t.description}</Text> : null}
    </View>
  );
}

function Stat({ label, value, unit, compact = false }) {
  return (
    <View>
      <Text style={[styles.statLabel, compact && styles.statLabelCompact]}>{label}</Text>
      <View style={styles.statValueRow}>
        <Text style={[styles.statValue, compact && styles.statValueCompact]}>{value}</Text>
        {unit ? <Text style={styles.statUnit}>{unit}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { alignSelf: 'stretch', borderRadius: 12, backgroundColor: colors.white, overflow: 'hidden' },
  bordered: { borderWidth: 1, borderColor: colors.neutral[200] },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  icon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.semibold, fontSize: 16, color: colors.black, flexShrink: 1 },
  meta: { alignItems: 'flex-end', gap: 2 },
  metaText: { fontFamily: fonts.medium, fontSize: 10, color: colors.neutral[700], textAlign: 'right' },
  stats: { flexDirection: 'row', alignItems: 'flex-start', gap: 48, padding: 16 },
  statLabel: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 12, color: colors.black },
  statValueRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  statValue: { fontFamily: fonts.condensedBoldItalic, fontSize: 32, lineHeight: 38, color: colors.neutral[950], textTransform: 'uppercase' },
  statUnit: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 22, color: colors.neutral[700] },
  description: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    marginTop: -4,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.neutral[800],
  },

  compact: {
    height: 176,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    backgroundColor: colors.white,
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    justifyContent: 'space-between',
  },
  compactTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  compactIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[100],
  },
  compactTitle: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 19, color: colors.black },
  compactKind: { color: colors.primary.default },
  compactStats: { flexDirection: 'row', justifyContent: 'space-between' },
  statLabelCompact: { fontSize: 10, lineHeight: 11 },
  statValueCompact: { fontSize: 18, lineHeight: 24 },
});
