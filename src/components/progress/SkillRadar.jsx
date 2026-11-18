import { PencilSimple } from 'phosphor-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polygon } from 'react-native-svg';

import { CARD_SHADOW, Delta, MUTED } from '@/components/progress/ProgressUI';
import Button from '@/components/ui/Button';
import { SKILLS, percentChange } from '@/lib/progress';
import { colors, fonts } from '@/theme';

const H = 380;
const CY = 190;
const R = 90; // radius for a 10/10

// Clockwise from the top, as in Figma (anticipation on top).
const angle = (i) => -Math.PI / 2 + (i * Math.PI * 2) / SKILLS.length;

/**
 * Figma "Skill trends": hexagon radar of the six "Profile of player"
 * ratings, this season (solid) over last season (dashed), each with its
 * x/10 badge and change. `skills` = { current, previous } from fetchSkills().
 */
export default function SkillRadar({ skills, width, onEdit }) {
  const { current, previous } = skills ?? {};
  if (!current) {
    return (
      <View style={[styles.card, styles.empty]}>
        <Text style={styles.emptyTitle}>Rate your skills</Text>
        <Text style={styles.emptyText}>
          Rate your dribbling, passing, shot power and more to see how they change from season to season.
        </Text>
        <Button size="small" label="Rate your skills" onPress={onEdit} />
      </View>
    );
  }

  const cx = width / 2;
  const at = (i, v) => [cx + Math.cos(angle(i)) * (R * v) / 10, CY + Math.sin(angle(i)) * (R * v) / 10];
  const poly = (row) => SKILLS.map((s, i) => at(i, row[s.key]).join(',')).join(' ');
  const ring = (v) => SKILLS.map((_, i) => at(i, v).join(',')).join(' ');

  return (
    <View
      style={[styles.card, { height: H }]}
      accessible
      accessibilityLabel={SKILLS.map((s) => `${s.label} ${current[s.key]} out of 10`).join(', ')}>
      <Svg width={width} height={H} style={StyleSheet.absoluteFill}>
        {[10, 6.67, 3.33].map((v) => (
          <Polygon key={v} points={ring(v)} fill="none" stroke={colors.neutral[200]} strokeWidth={1} />
        ))}
        {SKILLS.map((s, i) => {
          const [x, y] = at(i, 10);
          return <Line key={s.key} x1={cx} y1={CY} x2={x} y2={y} stroke={colors.neutral[200]} strokeWidth={1} />;
        })}
        {previous ? (
          <Polygon points={poly(previous)} fill="none" stroke={MUTED} strokeWidth={1.5} strokeDasharray="6 4" />
        ) : null}
        <Polygon points={poly(current)} fill="rgba(64,81,253,0.15)" stroke={colors.primary.default} strokeWidth={2.5} />
        {SKILLS.map((s, i) => {
          const [x, y] = at(i, current[s.key]);
          return <Circle key={s.key} cx={x} cy={y} r={4.5} fill={colors.primary.default} />;
        })}
      </Svg>

      {SKILLS.map((s, i) => {
        const [x, y] = at(i, 13.6);
        const change = previous ? percentChange(current[s.key], previous[s.key]) : null;
        return (
          <View key={s.key} style={[styles.label, { left: Math.max(4, Math.min(width - 88, x - 42)), top: y - 26 }]}>
            <Text style={styles.labelText}>{s.label}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{current[s.key]}/10</Text>
            </View>
            {change != null ? <Delta value={change} text={`${Math.abs(change)}%`} upColor={colors.success[600]} /> : null}
          </View>
        );
      })}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Update your skill ratings"
        hitSlop={8}
        onPress={onEdit}
        style={styles.edit}>
        <PencilSimple size={18} color={MUTED} />
      </Pressable>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={styles.solid} />
          <Text style={styles.legendText}>This season</Text>
        </View>
        {previous ? (
          <View style={styles.legendItem}>
            <View style={styles.dashes}>
              {[0, 1, 2].map((k) => (
                <View key={k} style={styles.dash} />
              ))}
            </View>
            <Text style={styles.legendText}>Last season</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 12, backgroundColor: colors.white, ...CARD_SHADOW },
  empty: { alignItems: 'center', gap: 8, padding: 24 },
  emptyTitle: { fontFamily: fonts.semibold, fontSize: 16, color: colors.black },
  emptyText: { fontFamily: fonts.medium, fontSize: 14, color: MUTED, textAlign: 'center', marginBottom: 8 },
  label: { position: 'absolute', width: 84, alignItems: 'center', gap: 4 },
  labelText: { fontFamily: fonts.medium, fontSize: 14, color: colors.black, textTransform: 'uppercase', textAlign: 'center' },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 9999, backgroundColor: colors.primary[100] },
  badgeText: { fontFamily: fonts.semiboldItalic, fontSize: 10, letterSpacing: -0.1, color: colors.primary[800] },
  edit: { position: 'absolute', top: 12, right: 12 },
  legend: { position: 'absolute', bottom: 12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 32 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  solid: { width: 23, height: 3, borderRadius: 2, backgroundColor: colors.primary.default },
  dashes: { flexDirection: 'row', gap: 3 },
  dash: { width: 6, height: 2, backgroundColor: MUTED },
  legendText: { fontFamily: fonts.medium, fontSize: 12, color: MUTED },
});
