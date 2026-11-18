import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

import CountryField from '@/components/profile/CountryField';
import HistoryEntryForm, { validateDates } from '@/components/profile/HistoryEntryForm';
import TextInput from '@/components/ui/TextInput';
import { useUser } from '@/context/UserContext';
import { deleteNationalTeam, fetchNationalTeam, nationalMissing, saveNationalTeam } from '@/lib/profile';

/** Add or edit a National team history entry (country, "France U19", dates, stats). ?id= edits. */
export default function NationalTeamEditor() {
  const router = useRouter();
  const { user } = useUser();
  const { id } = useLocalSearchParams();
  const editId = typeof id === 'string' ? id : null;

  const [entry, setEntry] = useState({
    country_code: null,
    team_name: '',
    start_date: '',
    end_date: '',
    is_current: false,
    matches_played: null,
    goals_scored: null,
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editId) return undefined;
    let cancelled = false;
    fetchNationalTeam(editId)
      .then((t) => !cancelled && t && setEntry({ ...t, end_date: t.end_date ?? '' }))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [editId]);

  const patch = (p) => setEntry((e) => ({ ...e, ...p }));

  const save = async () => {
    const e = validateDates(entry);
    if (!entry.country_code) e.country = 'Pick the country';
    if (!entry.team_name.trim()) e.team = 'Name the team, e.g. France U19';
    setErrors(e);
    if (Object.keys(e).length || saving) return;
    setSaving(true);
    try {
      await saveNationalTeam(user.id, { ...entry, id: editId });
      router.back();
    } catch (err) {
      setSaving(false);
      Alert.alert(
        'Could not save',
        nationalMissing(err) ? 'National team history isn’t set up on the server yet.' : (err?.message ?? 'Try again.'),
      );
    }
  };

  const remove = () =>
    deleteNationalTeam(user.id, editId)
      .then(() => router.back())
      .catch((err) => Alert.alert('Could not delete', err?.message ?? 'Try again.'));

  return (
    <HistoryEntryForm
      title={editId ? 'Edit national team' : 'Add national team'}
      value={entry}
      onChange={patch}
      errors={errors}
      saving={saving}
      onSave={save}
      onDelete={editId ? remove : null}
      onClose={() => router.back()}
      top={
        <>
          <CountryField
            label="Country"
            required
            title="National team of"
            value={entry.country_code}
            onChange={(c) =>
              // The team name starts as the country; add "U19" etc. if needed.
              patch({ country_code: c?.code ?? null, team_name: entry.team_name || c?.name || '' })
            }
          />
          <TextInput
            label="Team *"
            value={entry.team_name}
            onChangeText={(t) => patch({ team_name: t })}
            error={errors.team || errors.country}
            maxLength={60}
            placeholder="e.g. France U19"
          />
        </>
      }
    />
  );
}
