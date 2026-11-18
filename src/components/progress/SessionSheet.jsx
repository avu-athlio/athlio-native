import { ChartBar, CheckCircle, Clock, ClockCountdown, Target, Timer, X, XCircle } from 'phosphor-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CARD_SHADOW, MUTED } from '@/components/progress/ProgressUI';
import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/ui/Button';
import { colors, fonts } from '@/theme';

const STATUS = {
  planned: { label: 'Planned', icon: ClockCountdown, bg: colors.primary[100], fg: colors.primary[800] },
  missed: { label: 'Missed', icon: XCircle, bg: colors.negative.default, fg: colors.white },
  completed: { label: 'Completed', icon: CheckCircle, bg: colors.success[600], fg: colors.white },
};

/** planned (today or later) | missed (planned, day passed) | completed. */
export function sessionStatus(t, todayKey) {
  if (t.status !== 'planned') return 'completed';
  return t.date >= todayKey ? 'planned' : 'missed';
}

function title(t) {
  if (t.type === 'team') return 'Team training';
  if (t.type === 'recovery') return 'Recovery';
  return t.activity && t.activity !== 'Other' ? `Individual ${t.activity} training` : 'Individual training';
}

const longDate = (key) =>
  new Date(`${key}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

function effortLevel(n) {
  if (n == null) return null;
  if (n >= 7) return { label: 'High', bg: colors.negative.default };
  if (n >= 4) return { label: 'Medium', bg: colors.warning.default };
  return { label: 'Low', bg: colors.success[600] };
}

function Cell({ icon: Icon, label, value, unit, badge }) {
  return (
    <View style={styles.cell}>
      <View style={styles.cellIcon}>
        <Icon size={22} color={colors.primary[400]} />
      </View>
      <View style={styles.cellText}>
        <View style={styles.cellLabelRow}>
          <Text style={styles.cellLabel}>{label}</Text>
          {badge ? (
            <View style={[styles.effortBadge, { backgroundColor: badge.bg }]}>
              <Text style={styles.effortBadgeText}>{badge.label}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.cellValue} numberOfLines={1}>
          {value ?? '–'}
          {value != null && unit ? <Text style={styles.cellUnit}>{unit}</Text> : null}
        </Text>
      </View>
    </View>
  );
}

/**
 * Figma training detail popover: status badge, title, date, Time / Duration /
 * Focus / Effort, description. Planned → "Delete schedule training";
 * missed → "Log this training" (opens the form to fill it in).
 */
export default function SessionSheet({ session: t, todayKey, onClose, onLog, onDelete }) {
  const status = t ? sessionStatus(t, todayKey) : 'completed';
  const s = STATUS[status];
  const pending = status !== 'completed';
  const focus = t?.type === 'recovery' ? t?.activity : t?.focus;
  return (
    <BottomSheet variant="handle" visible={!!t} onClose={onClose}>
      {t ? (
        <View style={styles.body}>
          <View style={styles.top}>
            <View style={[styles.badge, { backgroundColor: s.bg }]}>
              <s.icon size={14} color={s.fg} weight="fill" />
              <Text style={[styles.badgeText, { color: s.fg }]}>{s.label}</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Close" style={styles.close}>
              <X size={20} color={colors.black} />
            </Pressable>
          </View>
          <View>
            <Text style={styles.title}>{title(t)}</Text>
            <Text style={styles.date}>{longDate(t.date)}</Text>
          </View>
          <View style={styles.grid}>
            <Cell icon={Clock} label="Time" value={t.startTime} />
            <Cell icon={Timer} label="Duration" value={t.duration ? t.duration : null} unit="min" />
            <Cell icon={Target} label={t.type === 'recovery' ? 'Type' : 'Focus'} value={focus || null} />
            <Cell
              icon={ChartBar}
              label="Effort"
              value={pending || t.effort == null ? null : t.effort}
              unit="/10"
              badge={pending ? null : effortLevel(t.effort)}
            />
          </View>
          {t.description ? (
            <View style={styles.desc}>
              <Text style={styles.cellLabel}>Description</Text>
              <Text style={styles.descText}>{t.description}</Text>
            </View>
          ) : null}
          {status === 'missed' ? <Button type="secondary" size="medium" label="Log this training" onPress={onLog} fullWidth /> : null}
          {status === 'planned' ? (
            <>
              <Button type="secondary" size="medium" label="Edit information" onPress={onLog} fullWidth />
              <Pressable accessibilityRole="button" onPress={onDelete} style={styles.delete}>
                <Text style={styles.deleteText}>Delete schedule training</Text>
              </Pressable>
            </>
          ) : null}
          {status === 'missed' ? (
            <Pressable accessibilityRole="button" onPress={onDelete} style={styles.delete}>
              <Text style={styles.deleteText}>Delete</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: 20, paddingHorizontal: 16 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 9999 },
  badgeText: { fontFamily: fonts.semiboldItalic, fontSize: 14, letterSpacing: -0.14, textTransform: 'uppercase' },
  close: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.neutral[100] },
  title: { fontFamily: fonts.condensedBoldItalic, fontSize: 28, color: colors.black, textTransform: 'uppercase' },
  date: { fontFamily: fonts.medium, fontSize: 16, color: MUTED, marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cell: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.white,
    ...CARD_SHADOW,
  },
  cellIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary[50] },
  cellText: { flex: 1, gap: 2 },
  cellLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cellLabel: { fontFamily: fonts.medium, fontSize: 12, color: colors.black, textTransform: 'uppercase' },
  cellValue: { fontFamily: fonts.condensedBold, fontSize: 24, color: colors.black },
  cellUnit: { fontFamily: fonts.condensedMedium, fontSize: 14, color: MUTED },
  effortBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 9999 },
  effortBadgeText: { fontFamily: fonts.semiboldItalic, fontSize: 10, color: colors.white, textTransform: 'uppercase' },
  desc: { gap: 6, padding: 12, borderRadius: 12, backgroundColor: colors.white, ...CARD_SHADOW },
  descText: { fontFamily: fonts.regular, fontSize: 14, color: MUTED },
  delete: { alignItems: 'center', paddingVertical: 8 },
  deleteText: { fontFamily: fonts.semibold, fontSize: 16, color: colors.negative.default },
});
