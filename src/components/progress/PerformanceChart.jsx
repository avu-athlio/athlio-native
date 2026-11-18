import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Line, Polyline, Rect, Stop } from 'react-native-svg';

import { MUTED } from '@/components/progress/ProgressUI';
import { seasonShort } from '@/lib/progress';
import { colors, fonts } from '@/theme';

const H = 232;
const TOP = 25; // y of the top tick
const BOTTOM = 186; // y of 0
const LEFT = 30;
const RIGHT_PAD = 20;

// 0 → max in 4 steps, max rounded up to something readable.
function niceMax(v) {
  if (v <= 4) return 4;
  const step = Math.ceil(v / 4 / 5) * 5 || 1;
  return step * 4;
}

/**
 * Figma performance line chart: two logged seasons (solid), the current
 * season so far (solid) then its projection and next season (dashed, hollow
 * dots) over a soft blue "predicted" band. `series` from seasonSeries().
 */
export default function PerformanceChart({ series, width }) {
  const [a, b, cur, next] = series;
  const plotW = width - LEFT - RIGHT_PAD;
  const xs = [0, 1, 2, 3].map((i) => LEFT + 16 + ((plotW - 32) * i) / 3);
  const gap = xs[1] - xs[0];
  const max = niceMax(Math.max(a.value, b.value, cur.value, next.value, cur.soFar ?? 0));
  const y = (v) => BOTTOM - ((BOTTOM - TOP) * v) / max;

  const hasProjection = cur.value > (cur.soFar ?? cur.value);
  const solid = [
    { x: xs[0], v: a.value },
    { x: xs[1], v: b.value },
    { x: xs[2], v: cur.soFar ?? cur.value },
  ];
  const dashed = [solid[2], ...(hasProjection ? [{ x: xs[2] + gap * 0.3, v: cur.value }] : []), { x: xs[3], v: next.value }];
  const pts = (list) => list.map((p) => `${p.x},${y(p.v)}`).join(' ');
  const bandX = xs[2] - 4;

  const labels = [...solid, ...dashed.slice(1)];
  const ticks = [max, (max * 3) / 4, max / 2, max / 4, 0];

  return (
    <View style={{ width, height: H }} accessible accessibilityLabel={describe(series)}>
      <Svg width={width} height={H}>
        <Defs>
          <LinearGradient id="band" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.primary.default} stopOpacity={0} />
            <Stop offset="1" stopColor={colors.primary.default} stopOpacity={0.2} />
          </LinearGradient>
        </Defs>
        {ticks.map((t) => (
          <Line key={t} x1={LEFT} x2={width - 4} y1={y(t)} y2={y(t)} stroke={colors.neutral[100]} strokeWidth={1} />
        ))}
        <Rect x={bandX} y={12} width={width - bandX} height={BOTTOM - 12} fill="url(#band)" />
        <Polyline points={pts(solid)} stroke={colors.primary.default} strokeWidth={2} fill="none" />
        <Polyline points={pts(dashed)} stroke={colors.primary.default} strokeWidth={2} strokeDasharray="6 5" fill="none" />
        {solid.map((p, i) => (
          <Circle key={`s${i}`} cx={p.x} cy={y(p.v)} r={4.3} fill={colors.primary.default} />
        ))}
        {dashed.slice(1).map((p, i) => (
          <Circle key={`d${i}`} cx={p.x} cy={y(p.v)} r={4.3} fill={colors.white} stroke={colors.primary.default} strokeWidth={1.5} />
        ))}
      </Svg>

      {ticks.map((t) => (
        <Text key={`t${t}`} style={[styles.tick, { top: y(t) - 8 }]}>
          {Math.round(t)}
        </Text>
      ))}
      {labels.map((p, i) => (
        <Text key={`v${i}`} style={[styles.value, { left: p.x - 20, top: y(p.v) - 24 }]}>
          {p.v}
        </Text>
      ))}
      {series.map((s, i) => (
        <View key={s.season} style={[styles.xCol, { left: xs[i] - 32 }]}>
          <Text style={styles.xLabel}>{seasonShort(s.season)}</Text>
          {s.predicted ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Predicted</Text>
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}

function describe(series) {
  return series.map((s) => `${seasonShort(s.season)}: ${s.value}${s.predicted ? ' predicted' : ''}`).join(', ');
}

const styles = StyleSheet.create({
  tick: { position: 'absolute', left: 0, width: 22, textAlign: 'right', fontFamily: fonts.semibold, fontSize: 13, color: MUTED },
  value: {
    position: 'absolute',
    width: 40,
    textAlign: 'center',
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.primary.default,
  },
  xCol: { position: 'absolute', top: BOTTOM + 7, width: 64, alignItems: 'center', gap: 4 },
  xLabel: { fontFamily: fonts.semibold, fontSize: 13, color: MUTED },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 9999, backgroundColor: colors.primary[100] },
  badgeText: {
    fontFamily: fonts.semiboldItalic,
    fontSize: 9.5,
    letterSpacing: -0.1,
    color: colors.primary[800],
    textTransform: 'uppercase',
  },
});
