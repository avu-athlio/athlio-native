// Playing styles from onboarding (components/onboarding/steps/PlayingStyle.jsx,
// which adds the player photos). Onboarding stores the id ("target-man");
// older rows store the label ("Playmaker").
export const PLAYING_STYLES = [
  { id: 'shot-stopper', label: 'Shot-stopper', positions: ['gk'] },
  { id: 'sweeper-keeper', label: 'Sweeper-keeper', positions: ['gk'] },
  { id: 'target-man', label: 'Target man', positions: ['st'] },
  { id: 'false-nine', label: 'False 9', positions: ['st'] },
  { id: 'creative-wide-player', label: 'Creative wide player', positions: ['lw', 'rw'] },
  { id: 'inverted-winger', label: 'Inverted winger', positions: ['lw', 'rw'] },
  { id: 'traditional-winger', label: 'Traditional winger', positions: ['lw', 'rw'] },
  { id: 'playmaker', label: 'Playmaker', positions: ['cam'] },
  { id: 'shadow-striker', label: 'Shadow striker', positions: ['cam'] },
  { id: 'box-to-box', label: 'Box to box', positions: ['cdm'] },
  { id: 'progressive-passer', label: 'Progressive passer', positions: ['cdm'] },
  { id: 'ball-winner-cdm', label: 'Ball winner', positions: ['cdm'] },
  { id: 'creative-wide-midfielder', label: 'Creative wide midfielder', positions: ['lm', 'rm'] },
  { id: 'direct-wide-player', label: 'Direct wide player', positions: ['lm', 'rm'] },
  { id: 'attacking-fullback', label: 'Attacking fullback', positions: ['lb', 'rb'] },
  { id: 'inverted-fullback', label: 'Inverted fullback', positions: ['lb', 'rb'] },
  { id: 'defensive-fullback', label: 'Defensive fullback', positions: ['lb', 'rb'] },
  { id: 'ball-playing-defender', label: 'Ball-playing defender', positions: ['cb'] },
  { id: 'aggressive-defender', label: 'Aggressive defender', positions: ['cb'] },
  { id: 'defensive-organiser', label: 'Defensive organiser', positions: ['cb'] },
];

const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
const byKey = new Map(PLAYING_STYLES.flatMap((s) => [[norm(s.id), s], [norm(s.label), s]]));

/** The style matching a stored id or label, or null. */
export const findPlayingStyle = (value) => (value ? byKey.get(norm(value)) ?? null : null);

/** Label to show for a stored playing style ("target-man" → "Target man"). */
export const playingStyleLabel = (value) => (value ? findPlayingStyle(value)?.label ?? value : null);
