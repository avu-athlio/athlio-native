import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Line, Path, RadialGradient, Stop } from 'react-native-svg';

const TILT = 0.28;

// Continent outlines as [lon, lat]. The globe faces lon=0, so roughly
// lon -90…+90 is visible. Ported unchanged from the web Globe.
const CONTINENTS = [
  // Africa
  [[-6,36],[10,37],[13,33],[20,32],[30,31],[35,29],[38,20],[43,12],[51,11],[45,2],[40,-4],[40,-10],[36,-18],[34,-22],[32,-28],[26,-34],[20,-35],[18,-33],[15,-27],[12,-16],[9,4],[3,6],[-1,5],[-5,5],[-11,6],[-15,11],[-17,15],[-17,21],[-14,24],[-9,30],[-6,36]],
  // Europe
  [[-9,36],[-9,44],[-4,44],[-5,48],[2,51],[8,55],[12,57],[28,72],[30,65],[30,60],[38,57],[35,47],[30,46],[28,46],[28,41],[24,38],[20,40],[16,38],[12,44],[8,44],[3,43],[-3,38],[-9,36]],
  // Greenland
  [[-44,60],[-38,65],[-22,70],[-18,75],[-24,80],[-40,83],[-55,83],[-65,80],[-68,75],[-64,70],[-58,65],[-50,62],[-44,60]],
  // North America (east, clipped at the limb)
  [[-90,60],[-85,58],[-78,55],[-67,48],[-65,44],[-70,42],[-76,38],[-80,35],[-82,30],[-80,25],[-80,20],[-84,15],[-88,16],[-90,16]],
  // South America
  [[-80,0],[-78,-2],[-75,-10],[-72,-18],[-68,-30],[-68,-55],[-65,-55],[-58,-52],[-55,-38],[-48,-28],[-40,-20],[-34,-8],[-38,-4],[-46,-1],[-52,4],[-58,8],[-60,12],[-72,12],[-75,8],[-78,5],[-80,0]],
  // Asia (west, clipped at the limb)
  [[28,41],[36,37],[36,33],[35,29],[38,20],[43,12],[54,18],[58,22],[62,22],[68,22],[70,20],[72,8],[80,8],[80,20],[87,22],[90,24],[90,56],[80,62],[60,56],[50,52],[44,44],[38,42],[28,41]],
];

const rad = (deg) => (deg * Math.PI) / 180;

function buildPath(coords, cx, cy, r) {
  let d = '';
  let penDown = false;
  for (const [lon, lat] of coords) {
    const x = cx + r * Math.cos(rad(lat)) * Math.sin(rad(lon));
    const y = cy - r * Math.sin(rad(lat));
    const visible = Math.cos(rad(lat)) * Math.cos(rad(lon)) > -0.05;
    if (visible) {
      d += `${penDown ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
      penDown = true;
    } else {
      penDown = false;
    }
  }
  return d ? `${d}Z` : '';
}

export default function Globe({ pinCoords, size = 300 }) {
  const r = (size - 4) / 2;
  const cx = size / 2;
  const cy = size / 2;

  const meridians = useMemo(
    () => [30, 60, 90, 120, 150].map((lon) => r * Math.sin(rad(lon))).filter((rx) => rx > 0.5),
    [r],
  );
  const parallels = useMemo(
    () =>
      [-60, -30, 0, 30, 60].map((lat) => ({
        rx: r * Math.cos(rad(lat)),
        ry: r * Math.cos(rad(lat)) * TILT,
        py: cy - r * Math.sin(rad(lat)),
        equator: lat === 0,
      })),
    [r, cy],
  );
  const continents = useMemo(() => CONTINENTS.map((c) => buildPath(c, cx, cy, r)), [cx, cy, r]);

  let pin = null;
  if (pinCoords) {
    const latR = rad(pinCoords.lat);
    const lonR = rad(pinCoords.lon);
    if (Math.cos(latR) * Math.cos(lonR) >= -0.15) {
      pin = { x: cx + r * Math.cos(latR) * Math.sin(lonR), y: cy - r * Math.sin(latR) };
    } else {
      // Far side of the globe: park the pin on the nearest edge.
      pin = { x: cx + r * 0.82 * (lonR > 0 ? 1 : -1), y: cy - r * 0.65 * Math.sin(latR) };
    }
  }

  return (
    <Animated.View style={[styles.outer, { width: size, height: size, borderRadius: size / 2 }]}>
      <Svg width={size} height={size}>
        <Defs>
          <ClipPath id="globe-clip">
            <Circle cx={cx} cy={cy} r={r} />
          </ClipPath>
          <RadialGradient id="globe-bg" cx="38%" cy="35%" r="65%">
            <Stop offset="0%" stopColor="#eef2ff" />
            <Stop offset="60%" stopColor="#dbe4ff" />
            <Stop offset="100%" stopColor="#bfcbff" />
          </RadialGradient>
        </Defs>

        <Circle cx={cx} cy={cy} r={r} fill="url(#globe-bg)" />

        <G clipPath="url(#globe-clip)">
          {continents.map((d, i) =>
            d ? (
              <Path
                key={i}
                d={d}
                fill="rgba(64,81,253,0.6)"
                stroke="rgba(64,81,253,0.75)"
                strokeWidth={0.8}
                strokeLinejoin="round"
              />
            ) : null,
          )}
        </G>

        <G clipPath="url(#globe-clip)" stroke="rgba(64,81,253,0.13)" strokeWidth={0.9} fill="none">
          <Line x1={cx} y1={cy - r} x2={cx} y2={cy + r} />
          {meridians.map((rx, i) => (
            <Ellipse key={`m${i}`} cx={cx} cy={cy} rx={rx} ry={r} />
          ))}
          {parallels.map((p, i) => (
            <Ellipse key={`p${i}`} cx={cx} cy={p.py} rx={p.rx} ry={p.ry} strokeWidth={p.equator ? 1.4 : 0.9} />
          ))}
        </G>

        <Circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(64,81,253,0.28)" strokeWidth={1.5} />

        {pin ? (
          <G>
            <Circle cx={pin.x} cy={pin.y} r={11} fill="rgba(64,81,253,0.12)" />
            <Circle cx={pin.x} cy={pin.y} r={6} fill="rgba(64,81,253,0.28)" />
            <Circle cx={pin.x} cy={pin.y} r={3.5} fill="#4051fd" />
            <Circle cx={pin.x} cy={pin.y} r={1.5} fill="#fff" opacity={0.8} />
          </G>
        ) : null}
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outer: {
    overflow: 'hidden',
    boxShadow: '0 16px 48px rgba(64,81,253,0.14)',
    animationName: {
      '0%': { transform: [{ translateY: 0 }] },
      '50%': { transform: [{ translateY: -12 }] },
      '100%': { transform: [{ translateY: 0 }] },
    },
    animationDuration: '4s',
    animationTimingFunction: 'ease-in-out',
    animationIterationCount: 'infinite',
  },
});
