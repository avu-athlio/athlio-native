import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PageTopbar } from '@/components/navigation/Topbar';
import SkillsForm, { DEFAULT_SKILLS, SKILL_FORM } from '@/components/progress/SkillsForm';
import Button from '@/components/ui/Button';
import { useUser } from '@/context/UserContext';
import { fetchSkills, planningMissing, saveSkills } from '@/lib/progress';
import { colors } from '@/theme';

const pick = (row) => (row ? Object.fromEntries(SKILL_FORM.map((s) => [s.key, row[s.key]])) : null);

/** Rate your skills for this season (player_skills); feeds the Skill trends radar. */
export default function Skills() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const [values, setValues] = useState(DEFAULT_SKILLS);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  // Start from this season's ratings, else last season's, else 5s.
  useEffect(() => {
    if (!user) return undefined;
    let cancelled = false;
    fetchSkills(user.id)
      .then(({ current, previous }) => {
        if (cancelled) return;
        const start = pick(current) ?? pick(previous);
        if (start) setValues(start);
        setLoaded(true);
      })
      .catch(() => !cancelled && setLoaded(true));
    return () => {
      cancelled = true;
    };
  }, [user]);

  const save = async () => {
    setSaving(true);
    try {
      await saveSkills(user.id, values);
      router.back();
    } catch (e) {
      setSaving(false);
      Alert.alert(
        'Could not save your skills',
        planningMissing(e) ? 'Skills aren’t set up on the server yet.' : (e?.message ?? 'Try again.'),
      );
    }
  };

  return (
    <View style={styles.screen}>
      <PageTopbar />
      {loaded ? (
        <ScrollView contentContainerStyle={styles.body}>
          <SkillsForm values={values} onChange={setValues} />
        </ScrollView>
      ) : (
        <ActivityIndicator style={styles.loader} color={colors.primary.default} />
      )}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button size="big" label={saving ? 'Saving…' : 'Save'} disabled={!loaded || saving} onPress={save} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.neutral.bg },
  body: { padding: 16 },
  loader: { flex: 1 },
  footer: { paddingHorizontal: 16, paddingTop: 12 },
});
