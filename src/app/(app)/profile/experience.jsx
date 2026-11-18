import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

import ClubPickerSheet from '@/components/compose/ClubPickerSheet';
import { FieldBox } from '@/components/compose/Pickers';
import HistoryEntryForm, { validateDates } from '@/components/profile/HistoryEntryForm';
import { useUser } from '@/context/UserContext';
import { deleteExperience, fetchExperience, saveExperience } from '@/lib/profile';

const clubLabel = (club) => (club ? [club.name, club.league].filter(Boolean).join(' - ') : '');

/** Add or edit a club in Career history (experiences). ?id= edits. */
export default function ExperienceEditor() {
  const router = useRouter();
  const { user, profile } = useUser();
  const { id } = useLocalSearchParams();
  const editId = typeof id === 'string' ? id : null;

  const [entry, setEntry] = useState({
    club: null,
    start_date: '',
    end_date: '',
    is_current: false,
    matches_played: null,
    goals_scored: null,
  });
  const [errors, setErrors] = useState({});
  const [picker, setPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editId) return undefined;
    let cancelled = false;
    fetchExperience(editId)
      .then((e) => !cancelled && e && setEntry({ ...e, end_date: e.end_date ?? '' }))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [editId]);

  const patch = (p) => setEntry((e) => ({ ...e, ...p }));

  const save = async () => {
    const e = validateDates(entry);
    if (!entry.club?.id) e.club = 'Pick your club from the list';
    setErrors(e);
    if (Object.keys(e).length || saving) return;
    setSaving(true);
    try {
      await saveExperience(user.id, { ...entry, id: editId });
      router.back();
    } catch (err) {
      setSaving(false);
      Alert.alert('Could not save', err?.message ?? 'Try again.');
    }
  };

  const remove = () =>
    deleteExperience(user.id, editId)
      .then(() => router.back())
      .catch((err) => Alert.alert('Could not delete', err?.message ?? 'Try again.'));

  return (
    <>
      <HistoryEntryForm
        title={editId ? 'Edit club' : 'Add club'}
        value={entry}
        onChange={patch}
        errors={errors}
        saving={saving}
        onSave={save}
        onDelete={editId ? remove : null}
        onClose={() => router.back()}
        hint="Matches you log after games for this club are added automatically. Only enter games from before you used Athlio."
        top={
          <FieldBox
            label="Club"
            required
            value={clubLabel(entry.club)}
            placeholder="Choose your club"
            onPress={() => setPicker(true)}
            error={errors.club}
          />
        }
      />
      <ClubPickerSheet
        visible={picker}
        title="Pick your club"
        searchPlaceholder="Search for your club"
        allowManual={false}
        country={profile?.country}
        value={entry.club}
        onChange={(club) => {
          patch({ club });
          setErrors((er) => ({ ...er, club: null }));
        }}
        onClose={() => setPicker(false)}
      />
    </>
  );
}
