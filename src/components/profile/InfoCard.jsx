import { Plus, TShirt } from 'phosphor-react-native';
import { StyleSheet, Text, View } from 'react-native';

import Button from '@/components/ui/Button';
import { calcAge, flagEmoji } from '@/lib/profile-format';
import { colors, fonts } from '@/theme';

const ALL_FIELDS = ['dob', 'nationality', 'location', 'height', 'weight', 'injured', 'foot', 'style', 'shirt'];

// Port of the web ProfileInfoCard: 3-column grid of athlete facts.
export default function InfoCard({ info, location, isMe, onAddInfo }) {
  const i = info ?? {};
  const age = calcAge(i.birth_date);
  const flag = flagEmoji(i.nationality_code);
  const foot = i.preferred_foot ? i.preferred_foot.charAt(0).toUpperCase() + i.preferred_foot.slice(1) : null;

  const fields = [
    i.birth_date && { id: 'dob', label: i.birth_date.replace(/-/g, '/'), value: age != null ? `${age} years` : i.birth_date },
    i.nationality && { id: 'nationality', label: 'Nationality', value: `${flag ? `${flag} ` : ''}${i.nationality}` },
    location && { id: 'location', label: 'Location', value: location },
    i.height_cm != null && { id: 'height', label: 'Height (cm)', value: String(i.height_cm) },
    i.weight_kg != null && { id: 'weight', label: 'Weight (kg)', value: String(i.weight_kg) },
    i.injured != null && { id: 'injured', label: 'Injured', value: i.injured ? 'Yes' : 'No' },
    foot && { id: 'foot', label: 'Foot', value: foot },
    i.playing_style && { id: 'style', label: 'Style', value: i.playing_style },
    i.shirt_number != null && { id: 'shirt', label: 'Number', value: String(i.shirt_number), shirt: true },
  ].filter(Boolean);

  const present = new Set(fields.map((f) => f.id));
  const missing = ALL_FIELDS.some((id) => !present.has(id));

  if (!fields.length && !isMe) {
    return (
      <View style={styles.card}>
        <Text style={styles.empty}>No info yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.grid}>
        {fields.map((f) => (
          <View key={f.id} style={styles.field}>
            <Text style={styles.label} numberOfLines={1}>
              {f.label}
            </Text>
            <View style={styles.valueRow}>
              {f.shirt ? <TShirt size={14} color={colors.black} /> : null}
              <Text style={styles.value}>{f.value}</Text>
            </View>
          </View>
        ))}
        {isMe && missing ? (
          <View style={[styles.field, styles.add]}>
            <Button type="subtle" size="xsmall" label="Add info" leadingIcon={Plus} onPress={onAddInfo} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: 12, padding: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 20, columnGap: 8 },
  field: { width: '31%', gap: 3 },
  add: { justifyContent: 'flex-end', alignItems: 'flex-start' },
  label: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    color: colors.neutral[600],
  },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  value: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 21, color: colors.black, flexShrink: 1 },
  empty: { fontFamily: fonts.regular, fontSize: 14, color: colors.neutral[600] },
});
