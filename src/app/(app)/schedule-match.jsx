import { useLocalSearchParams, useRouter } from 'expo-router';
import { X } from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ClubPickerSheet from '@/components/compose/ClubPickerSheet';
import { ChipGroup, DateField, FieldBox, SelectField } from '@/components/compose/Pickers';
import SuccessSheet from '@/components/compose/SuccessSheet';
import { PageTopbar } from '@/components/navigation/Topbar';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import { useUser } from '@/context/UserContext';
import { fetchClub } from '@/lib/posts';
import { planningMissing, schedulePlannedMatch } from '@/lib/progress';
import { isFutureDate } from '@/lib/trainings';
import { colors } from '@/theme';

const MATCH_TYPES = [
  'League match',
  'Cup match',
  'Friendly match',
  'National teams match',
  'National teams match (friendly)',
].map((v) => ({ value: v, label: v }));
const clubLabel = (club) => (club ? [club.name, club.league].filter(Boolean).join(' - ') : '');

/**
 * Figma "Schedule match": a match coming up, saved to planned_matches. On
 * the day it shows as "Match day" with "Log performance from match", which
 * opens Add match pre-filled. ?date= presets the date.
 */
export default function ScheduleMatch() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile } = useUser();
  const { date: rawDate } = useLocalSearchParams();

  const [form, setForm] = useState({
    homeOrAway: null,
    league: 'League match',
    date: isFutureDate(rawDate) ? rawDate : '',
    yourTeam: null,
    opponent: null,
  });
  const [errors, setErrors] = useState({});
  const [sheet, setSheet] = useState(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const patch = (v) => setForm((f) => ({ ...f, ...v }));
  const clearError = (k) => setErrors((e) => ({ ...e, [k]: null }));

  // Prefill "Your team" with my club.
  useEffect(() => {
    if (!profile?.club_id) return undefined;
    let cancelled = false;
    fetchClub(profile.club_id).then((club) => {
      if (!cancelled && club) setForm((f) => (f.yourTeam ? f : { ...f, yourTeam: club }));
    });
    return () => {
      cancelled = true;
    };
  }, [profile?.club_id]);

  const save = async () => {
    const e = {};
    if (!form.date) e.date = 'Date is required';
    else if (!isFutureDate(form.date)) e.date = 'Pick a day after today (log played matches with Add match)';
    if (!form.opponent) e.opponent = 'Opponent team is required';
    setErrors(e);
    if (Object.keys(e).length || saving) return;
    setSaving(true);
    try {
      await schedulePlannedMatch(user.id, form);
      setDone(true);
    } catch (err) {
      setSaving(false);
      Alert.alert(
        'Could not schedule the match',
        planningMissing(err) ? 'Scheduling isn’t set up on the server yet.' : (err?.message ?? 'Try again.'),
      );
    }
  };

  return (
    <View style={styles.screen}>
      <PageTopbar
        title="Schedule match"
        showBack={false}
        right={<IconButton size="small" icon={X} onPress={() => router.back()} accessibilityLabel="Close" />}
      />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <ChipGroup
          options={[
            { value: 'home', label: 'Home match' },
            { value: 'away', label: 'Away match' },
          ]}
          value={form.homeOrAway}
          onChange={(v) => patch({ homeOrAway: v })}
        />
        <SelectField label="Type" title="Pick the type" value={form.league} options={MATCH_TYPES} onChange={(v) => patch({ league: v })} />
        <DateField
          label="Date"
          required
          allowFuture
          yearsBack={0}
          yearsAhead={1}
          sheetTitle="Date of game"
          value={form.date}
          onChange={(v) => {
            patch({ date: v });
            clearError('date');
          }}
          error={errors.date}
        />
        <FieldBox
          label="Your team"
          value={clubLabel(form.yourTeam)}
          placeholder="Choose your team"
          onPress={() => setSheet('your-team')}
        />
        <FieldBox
          label="Opponent team"
          required
          value={clubLabel(form.opponent)}
          placeholder="Choose opponent team"
          onPress={() => setSheet('opponent')}
          error={errors.opponent}
        />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button label={saving ? 'Scheduling…' : 'Schedule match'} size="big" disabled={saving} onPress={save} />
      </View>

      <ClubPickerSheet
        visible={sheet === 'your-team'}
        title="Pick your team"
        manualLabel="Add your team manually"
        searchPlaceholder="Search for your team"
        country={profile?.country}
        value={form.yourTeam}
        onChange={(club) => patch({ yourTeam: club })}
        onClose={() => setSheet(null)}
      />
      <ClubPickerSheet
        visible={sheet === 'opponent'}
        title="Pick opponent team"
        manualLabel="Add opponent team manually"
        searchPlaceholder="Search for opponent team"
        country={profile?.country}
        value={form.opponent}
        onChange={(club) => {
          patch({ opponent: club });
          clearError('opponent');
        }}
        onClose={() => setSheet(null)}
      />
      <SuccessSheet
        visible={done}
        title="Match is scheduled"
        subtitle="Log your performance after the game"
        onClose={() => router.back()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.neutral.bg },
  body: { padding: 16, gap: 20 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: colors.neutral[200] },
});
