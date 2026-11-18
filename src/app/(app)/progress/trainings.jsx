import { useLocalSearchParams, useRouter } from 'expo-router';
import { CaretLeft, CaretRight, Plus } from 'phosphor-react-native';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OptionSheet } from '@/components/compose/Pickers';
import { PageTopbar } from '@/components/navigation/Topbar';
import { Bar, CARD_SHADOW, Delta, DropdownChip, MUTED, TipCard } from '@/components/progress/ProgressUI';
import SessionSheet, { sessionStatus } from '@/components/progress/SessionSheet';
import { DOT_COLORS, DateChip, DayHero, DayIcon } from '@/components/progress/TrainingDays';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import { useUser } from '@/context/UserContext';
import useProgressData from '@/hooks/useProgressData';
import {
  PROGRESS_PERIODS,
  addDays,
  consistencyTip,
  dateKey,
  dayKind,
  dayMap,
  dayStatus,
  deletePlannedMatch,
  endOfMonth,
  formatDuration,
  startOfMonth,
  startOfWeek,
  trainingBreakdown,
  trainingProgress,
} from '@/lib/progress';
import { TRAINING_LABELS, deleteTraining } from '@/lib/trainings';
import { colors, fonts } from '@/theme';

const DAYS_BACK = 14;
const DAYS_AHEAD = 14;
const CHIP = 56; // DateChip width + gap
const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const CAL_HEAD = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
const FILTERS = [
  { value: 'all', label: 'All activities' },
  { value: 'team', label: 'Team' },
  { value: 'individual', label: 'Individual' },
  { value: 'recovery', label: 'Recovery' },
  { value: 'match', label: 'Matches' },
];
const STATUS_TEXT = { planned: 'Planned', missed: 'Missed', completed: 'Completed' };
const STATUS_COLOR = { planned: colors.primary.default, missed: colors.negative.default, completed: colors.success[600] };

// A day seen through the consistency filter.
function filtered(day, filter) {
  if (!day || filter === 'all') return day;
  if (filter === 'match') return { trainings: [], planned: [], matches: day.matches, plannedMatches: day.plannedMatches };
  return {
    trainings: day.trainings.filter((t) => t.type === filter),
    planned: day.planned.filter((t) => t.type === filter),
    matches: [],
    plannedMatches: [],
  };
}

/**
 * Figma "Trainings": two weeks back and two weeks ahead, the selected day
 * (log it, or schedule a training / match on a future day), progress this
 * month/week, a consistency calendar and a tip. Synced apps (Apple Health,
 * Google Fit, Strava) aren't connected, so that list is left out.
 */
export default function Trainings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const { day: dayParam } = useLocalSearchParams();
  const { matches, trainings, planned, plannedMatches, loading, reload } = useProgressData();
  const scroll = useRef(null);

  const today = new Date();
  const todayKey = dateKey(today);
  const [selected, setSelected] = useState(
    typeof dayParam === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dayParam) ? dayParam : todayKey,
  );
  const [period, setPeriod] = useState('month');
  const [periodSheet, setPeriodSheet] = useState(false);
  const [filter, setFilter] = useState('all');
  const [filterSheet, setFilterSheet] = useState(false);
  const [month, setMonth] = useState(() => startOfMonth(today));
  const [open, setOpen] = useState(null); // session shown in the sheet

  const days = dayMap(trainings, matches, planned, plannedMatches);
  const strip = Array.from({ length: DAYS_BACK + DAYS_AHEAD + 1 }, (_, i) => {
    const d = addDays(today, i - DAYS_BACK);
    const key = dateKey(d);
    return { key, weekday: WEEKDAYS[d.getDay()], date: d.getDate(), dot: dayStatus(days.get(key), key, todayKey) };
  });
  const sel = days.get(selected);
  const sessions = [...(sel?.trainings ?? []), ...(sel?.planned ?? [])];
  const match = sel?.matches[0];
  const plannedMatch = sel?.plannedMatches[0];
  const future = selected > todayKey;

  const progress = trainingProgress(trainings, period);
  const breakdown = trainingBreakdown(progress.rows);
  const tip = consistencyTip(trainings);

  // Calendar: whole weeks covering the month.
  const first = startOfWeek(month);
  const last = endOfMonth(month);
  const cells = [];
  for (let d = first; d <= last || cells.length % 7; d = addDays(d, 1)) cells.push(d);
  const monthTitle = month.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }).toUpperCase();
  const monthsAhead = (month.getFullYear() - today.getFullYear()) * 12 + month.getMonth() - today.getMonth();

  const openTraining = (date) => router.push({ pathname: '/add-training', params: { date } });
  const pickDay = (key) => {
    setSelected(key);
    scroll.current?.scrollTo({ y: 0, animated: true });
  };
  const confirm = (titleText, body, action) =>
    Alert.alert(titleText, body, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          action()
            .then(reload)
            .catch((e) => Alert.alert('Could not delete', e?.message ?? 'Try again.')),
      },
    ]);

  return (
    <View style={styles.screen}>
      <PageTopbar
        title="Trainings"
        right={
          <IconButton
            size="small"
            icon={Plus}
            onPress={() => openTraining(selected)}
            accessibilityLabel={future ? 'Schedule a training' : 'Log a training'}
          />
        }
      />
      <ScrollView ref={scroll} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.bleed}
          contentContainerStyle={styles.strip}
          contentOffset={{ x: Math.max(0, (DAYS_BACK - 3) * CHIP), y: 0 }}>
          {strip.map((d) => (
            <DateChip key={d.key} day={d} selected={d.key === selected} onPress={() => setSelected(d.key)} />
          ))}
        </ScrollView>

        {loading ? <ActivityIndicator color={colors.primary.default} /> : null}

        <View style={styles.day}>
          {sessions.map((t) => {
            const st = sessionStatus(t, todayKey);
            return (
              <Pressable
                key={t.id}
                accessibilityRole="button"
                accessibilityLabel={`${TRAINING_LABELS[t.type]} training, ${STATUS_TEXT[st]}`}
                onPress={() => setOpen(t)}
                style={({ pressed }) => [styles.session, pressed && styles.pressed]}>
                <View style={styles.sessionIcon}>
                  <DayIcon kind={t.type} size={24} />
                </View>
                <View style={styles.sessionText}>
                  <Text style={styles.sessionTitle}>{TRAINING_LABELS[t.type]} training</Text>
                  <Text style={styles.sessionSub}>
                    {[t.startTime, t.duration ? formatDuration(t.duration) : null, t.activity || t.focus]
                      .filter(Boolean)
                      .join(' · ') || '—'}
                  </Text>
                </View>
                <Text style={[styles.sessionStatus, { color: STATUS_COLOR[st] }]}>{STATUS_TEXT[st]}</Text>
                <CaretRight size={18} color={MUTED} />
              </Pressable>
            );
          })}

          {match || plannedMatch || !sessions.length ? (
            <DayHero tag={match || plannedMatch ? 'Match day' : null} height={225} />
          ) : null}
          {plannedMatch ? (
            <Text style={styles.matchLine}>
              {plannedMatch.match_type} · {plannedMatch.your_team ? `${plannedMatch.your_team} vs ` : 'vs '}
              {plannedMatch.opponent}
            </Text>
          ) : null}

          {match ? (
            <Button
              size="big"
              label="Post about this match"
              onPress={() => router.push({ pathname: '/post-about-match/[matchId]', params: { matchId: match.id } })}
            />
          ) : plannedMatch && !future ? (
            <Button
              size="big"
              label="Log performance from match"
              onPress={() => router.push({ pathname: '/add-match', params: { planned: plannedMatch.id } })}
            />
          ) : future ? (
            <>
              <Button size="big" label="Schedule training" onPress={() => openTraining(selected)} />
              {plannedMatch ? null : (
                <Button
                  type="subtle"
                  size="small"
                  label="Schedule match"
                  onPress={() => router.push({ pathname: '/schedule-match', params: { date: selected } })}
                />
              )}
            </>
          ) : (
            <>
              <Button size="big" label="Log your training" onPress={() => openTraining(selected)} />
              <Button
                type="subtle"
                size="small"
                label="Log performance from match"
                onPress={() => router.push({ pathname: '/add-match', params: { date: selected } })}
              />
            </>
          )}
          {plannedMatch ? (
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                confirm('Delete this scheduled match?', `vs ${plannedMatch.opponent}`, () =>
                  deletePlannedMatch(user.id, plannedMatch.id),
                )
              }
              style={styles.deleteLink}>
              <Text style={styles.deleteText}>Delete scheduled match</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.heading}>Your progress</Text>
            <DropdownChip
              label={PROGRESS_PERIODS.find((p) => p.value === period).label}
              onPress={() => setPeriodSheet(true)}
            />
          </View>
          <View style={styles.statRow}>
            <Stat label="Sessions" value={String(progress.sessions)} change={progress.sessionsChange} period={period} />
            <Stat label="Duration" value={formatDuration(progress.minutes)} change={progress.minutesChange} period={period} />
            <Stat
              label="Avr. effort"
              value={progress.effort == null ? '–' : progress.effort.toFixed(1)}
              change={progress.effortChange}
              period={period}
            />
          </View>
          <View style={styles.card}>
            {breakdown.map((b) => (
              <View key={b.label} style={styles.breakRow}>
                <View style={styles.breakMain}>
                  <View style={styles.breakTop}>
                    <Text style={styles.breakLabel}>{b.label}</Text>
                    <Text style={styles.breakPct}>{b.pct}%</Text>
                  </View>
                  <Bar pct={b.pct} color={colors.primary[400]} height={6} />
                </View>
                <Text style={styles.breakCount}>
                  {b.count}
                  {'\n'}
                  {b.count === 1 ? 'session' : 'sessions'}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.heading}>Consistency</Text>
            <DropdownChip label={FILTERS.find((f) => f.value === filter).label} onPress={() => setFilterSheet(true)} />
          </View>
          <View style={[styles.card, styles.calendar]}>
            <View style={styles.calHead}>
              <IconButton
                size="small"
                icon={CaretLeft}
                onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                accessibilityLabel="Previous month"
              />
              <Text style={styles.calTitle}>{monthTitle}</Text>
              <IconButton
                size="small"
                icon={CaretRight}
                disabled={monthsAhead >= 12}
                onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                accessibilityLabel="Next month"
              />
            </View>
            <View style={styles.calGrid}>
              {CAL_HEAD.map((h) => (
                <Text key={h} style={styles.calWeekday}>
                  {h}
                </Text>
              ))}
              {cells.map((d) => {
                const key = dateKey(d);
                const inMonth = d.getMonth() === month.getMonth();
                const day = filtered(days.get(key), filter);
                const kind = inMonth ? dayKind(day) : null;
                const dot = dayStatus(day, key, todayKey);
                return (
                  <Pressable
                    key={key}
                    accessibilityRole="button"
                    accessibilityLabel={`${d.getDate()} ${monthTitle}${kind ? `, ${kind}, ${dot}` : ''}`}
                    disabled={!inMonth}
                    onPress={() => pickDay(key)}
                    style={styles.calCellWrap}>
                    <View style={[styles.calCell, key === todayKey && styles.calToday, key === selected && styles.calSelected]}>
                      {kind ? (
                        <DayIcon kind={kind} size={24} />
                      ) : (
                        <Text style={[styles.calNum, !inMonth && styles.calNumOff]}>{d.getDate()}</Text>
                      )}
                    </View>
                    {kind && dot !== 'none' ? <View style={[styles.calDot, { backgroundColor: DOT_COLORS[dot] }]} /> : null}
                  </Pressable>
                );
              })}
            </View>
          </View>
          <TipCard title={tip.title} text={tip.text} />
        </View>
      </ScrollView>

      <SessionSheet
        session={open}
        todayKey={todayKey}
        onClose={() => setOpen(null)}
        onLog={() => {
          const id = open.id;
          setOpen(null);
          router.push({ pathname: '/add-training', params: { id } });
        }}
        onDelete={() => {
          const t = open;
          setOpen(null);
          confirm('Delete this training?', `${TRAINING_LABELS[t.type]} training`, () => deleteTraining(user.id, t.id));
        }}
      />
      <OptionSheet
        visible={periodSheet}
        title="Choose progress period"
        options={PROGRESS_PERIODS}
        value={period}
        onSelect={(v) => {
          setPeriod(v);
          setPeriodSheet(false);
        }}
        onClose={() => setPeriodSheet(false)}
      />
      <OptionSheet
        visible={filterSheet}
        title="Choose activity type"
        options={FILTERS}
        value={filter}
        onSelect={(v) => {
          setFilter(v);
          setFilterSheet(false);
        }}
        onClose={() => setFilterSheet(false)}
      />
    </View>
  );
}

function Stat({ label, value, change, period }) {
  const word = period === 'week' ? 'last week' : 'last month';
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {change != null ? (
        <Delta value={change} text={`${Math.abs(change)}% vs ${word}`} pill size={12} upColor={colors.success[600]} />
      ) : (
        <Text style={styles.statNone}>vs {word}: –</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.neutral.bg },
  content: { padding: 16, gap: 32 },
  bleed: { marginHorizontal: -16, marginBottom: -16 },
  strip: { paddingHorizontal: 12, gap: 4 },
  day: { gap: 8 },
  session: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.white,
    ...CARD_SHADOW,
  },
  pressed: { opacity: 0.8 },
  sessionIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary[50] },
  sessionText: { flex: 1, gap: 2 },
  sessionTitle: { fontFamily: fonts.semibold, fontSize: 16, color: colors.black },
  sessionSub: { fontFamily: fonts.medium, fontSize: 13, color: MUTED },
  sessionStatus: { fontFamily: fonts.semiboldItalic, fontSize: 12, textTransform: 'uppercase' },
  matchLine: { fontFamily: fonts.semibold, fontSize: 14, color: colors.black, textAlign: 'center' },
  deleteLink: { alignItems: 'center', paddingVertical: 6 },
  deleteText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.negative.default },
  section: { gap: 16 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heading: { fontFamily: fonts.semibold, fontSize: 18, color: colors.black },
  statRow: { flexDirection: 'row', gap: 8 },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 4,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.white,
    ...CARD_SHADOW,
  },
  statLabel: { fontFamily: fonts.medium, fontSize: 14, color: colors.black, textTransform: 'uppercase' },
  statValue: { fontFamily: fonts.condensedBoldItalic, fontSize: 36, color: colors.black },
  statNone: { fontFamily: fonts.medium, fontSize: 10, color: MUTED },
  card: { padding: 16, gap: 14, borderRadius: 12, backgroundColor: colors.white, ...CARD_SHADOW },
  breakRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  breakMain: { flex: 1, gap: 8 },
  breakTop: { flexDirection: 'row', justifyContent: 'space-between' },
  breakLabel: { fontFamily: fonts.medium, fontSize: 16, color: colors.black },
  breakPct: { fontFamily: fonts.medium, fontSize: 14, color: colors.black },
  breakCount: { width: 56, textAlign: 'center', fontFamily: fonts.regular, fontSize: 12, color: MUTED },
  calendar: { paddingHorizontal: 12 },
  calHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  calTitle: { fontFamily: fonts.semibold, fontSize: 16, color: colors.black },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 4 },
  calWeekday: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontFamily: fonts.medium,
    fontSize: 12,
    color: MUTED,
    marginBottom: 4,
  },
  calCellWrap: { width: `${100 / 7}%`, alignItems: 'center' },
  calCell: {
    width: 42,
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral.bg,
  },
  calSelected: { borderWidth: 2, borderColor: colors.primary.default },
  calToday: { borderWidth: 1.5, borderColor: '#5d6bfd', backgroundColor: colors.white },
  calNum: { fontFamily: fonts.medium, fontSize: 16, color: colors.black },
  calNumOff: { color: colors.neutral[400] },
  calDot: { position: 'absolute', top: -3, right: 2, width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: colors.white },
});
