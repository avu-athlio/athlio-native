import { Image } from 'expo-image';
import { PencilSimple } from 'phosphor-react-native';
import { StyleSheet, Text, View } from 'react-native';

import Button from '@/components/ui/Button';
import { calcAge, flagEmoji } from '@/lib/profile-format';
import { playingStyleLabel } from '@/utils/playingStyles';
import { codeForCountry } from '@/utils/countries';
import { colors, fonts } from '@/theme';

const MUTED = '#72717a';
const JERSEY = require('@/assets/images/profile/jersey.svg');
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : null);

/**
 * Figma "Card Info Single": always the same 3 × 3 grid — age, nationality,
 * location / height, weight, injured / preferred foot, playing style, shirt
 * number. Unknown values show "–". My own profile gets "Edit info".
 */
export default function InfoCard({ info, country, isMe, onAddInfo }) {
  const i = info ?? {};
  const age = calcAge(i.birth_date);
  const nationFlag = flagEmoji(codeForCountry(i.nationality) ?? i.nationality_code);
  const placeFlag = flagEmoji(codeForCountry(country));

  const fields = [
    { id: 'dob', label: i.birth_date ? i.birth_date.replace(/-/g, '/') : 'Age', value: age != null ? `${age} years` : null },
    { id: 'nationality', label: 'Nationality', value: i.nationality, flag: nationFlag },
    { id: 'location', label: 'Location', value: country, flag: placeFlag },
    { id: 'height', label: 'Height (cm)', value: i.height_cm != null ? String(i.height_cm) : null },
    { id: 'weight', label: 'Weight (kg)', value: i.weight_kg != null ? String(i.weight_kg) : null },
    { id: 'injured', label: 'Injured', value: i.injured == null ? null : i.injured ? 'Yes' : 'No' },
    { id: 'foot', label: 'Preferred foot', value: cap(i.preferred_foot) },
    { id: 'style', label: 'Playing style', value: playingStyleLabel(i.playing_style) },
    { id: 'shirt', label: 'Shirt number', value: i.shirt_number != null ? String(i.shirt_number) : null, shirt: true },
  ];
  const rows = [fields.slice(0, 3), fields.slice(3, 6), fields.slice(6, 9)];
  const missing = fields.some((f) => f.value == null);

  return (
    <View style={styles.card}>
      {rows.map((row, r) => (
        <View key={r} style={styles.row}>
          {row.map((f) => (
            <View
              key={f.id}
              style={styles.field}
              accessible
              accessibilityLabel={`${f.id === 'dob' ? 'Age' : f.label}: ${f.value ?? 'not added'}`}>
              <Text style={styles.label} numberOfLines={1}>
                {f.label}
              </Text>
              <View style={styles.valueRow}>
                {f.value != null && f.flag ? <Text style={styles.flag}>{f.flag}</Text> : null}
                {f.value != null && f.shirt ? <Image source={JERSEY} style={styles.jersey} /> : null}
                <Text style={[styles.value, f.value == null && styles.none]} numberOfLines={1}>
                  {f.value ?? '–'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ))}
      {isMe ? (
        <Button
          type="subtle"
          size="xsmall"
          label={missing ? 'Add your info' : 'Edit info'}
          leadingIcon={PencilSimple}
          onPress={onAddInfo}
          style={styles.edit}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 24,
    padding: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
    boxShadow: '0 0 21px rgba(0,0,0,0.08)',
  },
  row: { flexDirection: 'row', gap: 16 },
  field: { flex: 1, gap: 4, minWidth: 0 },
  label: { fontFamily: fonts.medium, fontSize: 12, color: MUTED, textTransform: 'uppercase' },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  flag: { fontSize: 14, lineHeight: 19 },
  jersey: { width: 16, height: 16 },
  value: { fontFamily: fonts.medium, fontSize: 16, color: colors.black, flexShrink: 1 },
  none: { color: colors.neutral[400] },
  edit: { alignSelf: 'flex-start', marginTop: -8, marginLeft: -8 },
});
