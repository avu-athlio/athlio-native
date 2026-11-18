import { X } from 'phosphor-react-native';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChipGroup, DateField } from '@/components/compose/Pickers';
import { PageTopbar } from '@/components/navigation/Topbar';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import TextInput from '@/components/ui/TextInput';
import { colors, fonts } from '@/theme';

const CURRENT = [
  { value: 'no', label: 'Past' },
  { value: 'yes', label: 'Current' },
];

/** Shared check for a history entry; returns { field: message }. */
export function validateDates(e) {
  const errors = {};
  if (!e.start_date) errors.start = 'Pick when you joined';
  if (!e.is_current && e.end_date && e.start_date && e.end_date < e.start_date) errors.end = 'Must be after the start';
  return errors;
}

/**
 * Shared layout for "Add club" / "Add national team": the `top` fields,
 * then From / Current / To, matches and goals. Save, and Delete when editing.
 */
export default function HistoryEntryForm({ title, top, value, onChange, errors, saving, onSave, onDelete, onClose, hint }) {
  const insets = useSafeAreaInsets();
  const v = value;
  return (
    <View style={styles.screen}>
      <PageTopbar
        title={title}
        showBack={false}
        right={<IconButton size="small" icon={X} onPress={onClose} accessibilityLabel="Close" />}
      />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {top}
          <ChipGroup
            options={CURRENT}
            value={v.is_current ? 'yes' : 'no'}
            onChange={(c) => onChange({ is_current: c === 'yes' })}
          />
          <DateField
            label="From"
            required
            sheetTitle="From"
            yearsBack={40}
            value={v.start_date}
            onChange={(d) => onChange({ start_date: d })}
            error={errors.start}
          />
          {v.is_current ? null : (
            <DateField
              label="To"
              sheetTitle="To"
              yearsBack={40}
              value={v.end_date ?? ''}
              onChange={(d) => onChange({ end_date: d })}
              error={errors.end}
            />
          )}
          {v.is_current && hint ? <Text style={styles.hint}>{hint}</Text> : null}
          <View style={styles.pair}>
            <TextInput
              label={v.is_current && hint ? 'Matches before' : 'Matches'}
              value={v.matches_played == null ? '' : String(v.matches_played)}
              onChangeText={(t) => onChange({ matches_played: t ? Number(t.replace(/\D/g, '')) : null })}
              keyboardType="number-pad"
              maxLength={4}
              style={styles.flex}
            />
            <TextInput
              label={v.is_current && hint ? 'Goals before' : 'Goals'}
              value={v.goals_scored == null ? '' : String(v.goals_scored)}
              onChangeText={(t) => onChange({ goals_scored: t ? Number(t.replace(/\D/g, '')) : null })}
              keyboardType="number-pad"
              maxLength={4}
              style={styles.flex}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {onDelete ? (
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              Alert.alert('Delete this entry?', undefined, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: onDelete },
              ])
            }
            style={styles.delete}>
            <Text style={styles.deleteText}>Delete</Text>
          </Pressable>
        ) : null}
        <Button size="medium" label={saving ? 'Saving…' : 'Save'} disabled={saving} onPress={onSave} style={styles.flex} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.neutral.bg },
  flex: { flex: 1 },
  body: { padding: 16, gap: 20 },
  pair: { flexDirection: 'row', gap: 12 },
  hint: { fontFamily: fonts.regular, fontSize: 13, color: colors.neutral[700], marginBottom: -8 },
  footer: { flexDirection: 'row', gap: 12, padding: 16, borderTopWidth: 1, borderTopColor: colors.neutral[200] },
  delete: { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center' },
  deleteText: { fontFamily: fonts.semibold, fontSize: 16, color: colors.negative.default },
});
