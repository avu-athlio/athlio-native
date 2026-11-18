import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import { CaretRight, Plus, X } from 'phosphor-react-native';
import { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChipGroup, DateField, SelectField } from '@/components/compose/Pickers';
import { PageTopbar } from '@/components/navigation/Topbar';
import { ClubLogo } from '@/components/profile/CareerHistory';
import CountryField from '@/components/profile/CountryField';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import TextArea from '@/components/ui/TextArea';
import TextInput from '@/components/ui/TextInput';
import { useUser } from '@/context/UserContext';
import {
  fetchExperiences,
  fetchInfo,
  fetchNationalTeams,
  isUsernameTaken,
  saveInfo,
  saveProfile,
} from '@/lib/profile';
import { calcAge, experienceDates, flagEmoji } from '@/lib/profile-format';
import { colors, fonts } from '@/theme';
import { codeForCountry, nameForCode } from '@/utils/countries';
import { PLAYING_STYLES, findPlayingStyle } from '@/utils/playingStyles';
import { isProfessional } from '@/utils/roles';

const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];
const FEET = [
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'both', label: 'Both' },
];
const INJURED = [
  { value: 'no', label: 'No' },
  { value: 'yes', label: 'Yes' },
];
const STYLE_OPTIONS = PLAYING_STYLES.map((s) => ({ value: s.id, label: s.label }));
const BIO_MAX = 150;
const USERNAME_RE = /^[a-z0-9._]{3,30}$/;
const numOrNull = (s) => (String(s).trim() ? Number(s) : null);
const digits = (v) => v.replace(/\D/g, '');

function HistoryRows({ rows, onOpen, addLabel, onAdd }) {
  return (
    <View style={styles.history}>
      {rows.map((r) => (
        <Pressable
          key={r.id}
          accessibilityRole="button"
          accessibilityHint="Opens it to edit"
          onPress={() => onOpen(r.id)}
          style={({ pressed }) => [styles.historyRow, pressed && styles.pressed]}>
          <View style={styles.historyLogo}>{r.logo}</View>
          <View style={styles.historyText}>
            <Text style={styles.historyName} numberOfLines={1}>
              {r.name}
            </Text>
            <Text style={styles.historyDate} numberOfLines={1}>
              {r.date}
            </Text>
          </View>
          <CaretRight size={18} color={colors.neutral[500]} />
        </Pressable>
      ))}
      <Button type="subtle" size="small" label={addLabel} leadingIcon={Plus} onPress={onAdd} style={styles.addRow} />
    </View>
  );
}

/**
 * Port of pages/ProfileEdit, plus the Info tab: athletes can fill in date of
 * birth, nationality, height, weight, injured, preferred foot, playing style
 * and shirt number, and manage career and national team history. Every
 * field is optional except name and username.
 */
export default function EditProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile, setProfile } = useUser();
  const athlete = !isProfessional(profile?.role);

  const [form, setForm] = useState(() => ({
    full_name: profile?.full_name ?? '',
    username: profile?.username ?? '',
    bio: profile?.bio ?? '',
    city: profile?.city ?? '',
    countryCode: codeForCountry(profile?.country),
    countryText: profile?.country ?? '',
    age: profile?.age != null ? String(profile.age) : '',
    gender: profile?.gender ?? '',
  }));
  const [info, setInfo] = useState({
    birth_date: '',
    nationalityCode: null,
    height_cm: '',
    weight_kg: '',
    injured: null,
    preferred_foot: null,
    playing_style: null,
    shirt_number: '',
  });
  const [history, setHistory] = useState({ experiences: [], national: [] });
  const [avatar, setAvatar] = useState(null); // newly picked { uri, mimeType }
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setI = (patch) => setInfo((f) => ({ ...f, ...patch }));
  const uid = user?.id;

  // Current info row.
  useEffect(() => {
    if (!uid || !athlete) return undefined;
    let cancelled = false;
    fetchInfo(uid)
      .then((row) => {
        if (cancelled || !row) return;
        setInfo({
          birth_date: row.birth_date ?? '',
          nationalityCode: codeForCountry(row.nationality) ?? row.nationality_code ?? null,
          height_cm: row.height_cm != null ? String(row.height_cm) : '',
          weight_kg: row.weight_kg != null ? String(row.weight_kg) : '',
          injured: row.injured == null ? null : row.injured ? 'yes' : 'no',
          preferred_foot: row.preferred_foot ?? null,
          playing_style: findPlayingStyle(row.playing_style)?.id ?? null,
          shirt_number: row.shirt_number != null ? String(row.shirt_number) : '',
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [uid, athlete]);

  // Career and national team lists (refreshed after editing an entry).
  useFocusEffect(
    useCallback(() => {
      if (!uid || !athlete) return undefined;
      let cancelled = false;
      Promise.all([fetchExperiences(uid), fetchNationalTeams(uid)])
        .then(([experiences, national]) => !cancelled && setHistory({ experiences, national }))
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }, [uid, athlete]),
  );

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    setAvatar({ uri: asset.uri, mimeType: asset.mimeType });
  };

  const save = async () => {
    const username = form.username.trim().toLowerCase();
    const next = {};
    if (!form.full_name.trim()) next.full_name = 'Enter your name.';
    if (!USERNAME_RE.test(username)) next.username = '3–30 characters: letters, numbers, . and _';
    if (!athlete && form.age && !/^\d{1,3}$/.test(form.age.trim())) next.age = 'Enter a number.';
    if (athlete) {
      const h = numOrNull(info.height_cm);
      const w = numOrNull(info.weight_kg);
      const n = numOrNull(info.shirt_number);
      if (h != null && (h < 100 || h > 230)) next.height = 'Between 100 and 230 cm.';
      if (w != null && (w < 30 || w > 150)) next.weight = 'Between 30 and 150 kg.';
      if (n != null && (n < 1 || n > 99)) next.shirt = 'Between 1 and 99.';
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    setSaveError('');
    try {
      if (username !== profile?.username && (await isUsernameTaken(username, user.id))) {
        setErrors({ username: 'That username is taken.' });
        return;
      }
      // Athletes: age follows the date of birth when there is one.
      const dobAge = athlete ? calcAge(info.birth_date) : null;
      const country = form.countryCode ? nameForCode(form.countryCode) : form.countryText.trim() || null;
      const saved = await saveProfile(
        user.id,
        {
          full_name: form.full_name.trim(),
          username,
          bio: form.bio.trim() || null,
          city: form.city.trim() || null,
          country,
          age: dobAge ?? (form.age.trim() ? parseInt(form.age, 10) : null),
          gender: form.gender || null,
        },
        avatar,
      );
      if (athlete) {
        await saveInfo(user.id, {
          birth_date: info.birth_date || null,
          nationality: info.nationalityCode ? nameForCode(info.nationalityCode) : null,
          nationality_code: info.nationalityCode,
          height_cm: numOrNull(info.height_cm),
          weight_kg: numOrNull(info.weight_kg),
          injured: info.injured == null ? null : info.injured === 'yes',
          preferred_foot: info.preferred_foot,
          playing_style: info.playing_style,
          shirt_number: numOrNull(info.shirt_number),
        });
      }
      setProfile(saved);
      router.back();
    } catch (e) {
      setSaveError(e?.message ?? 'Could not save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const experienceRows = history.experiences.map((e) => ({
    id: e.id,
    logo: <ClubLogo url={e.club?.logo_url} name={e.club?.name} size={24} />,
    name: e.club?.name ?? 'Club',
    date: experienceDates(e).filter(Boolean).join(' '),
  }));
  const nationalRows = history.national.map((t) => ({
    id: t.id,
    logo: <Text style={styles.flag}>{flagEmoji(t.country_code)}</Text>,
    name: t.team_name,
    date: experienceDates(t).filter(Boolean).join(' '),
  }));

  return (
    <View style={styles.screen}>
      <PageTopbar title="Edit profile" backIcon={X} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Change profile picture"
            onPress={pickPhoto}
            style={styles.avatar}>
            <Avatar uri={avatar?.uri ?? profile?.avatar_url} size="xlarge" verified={profile?.verified} />
            <Text style={styles.changePhoto}>Change photo</Text>
          </Pressable>

          <View style={styles.fields}>
            <TextInput
              label="Full name *"
              value={form.full_name}
              onChangeText={(v) => set({ full_name: v })}
              error={errors.full_name}
              autoComplete="name"
              textContentType="name"
            />
            <TextInput
              label="Username *"
              value={form.username}
              onChangeText={(v) => set({ username: v })}
              error={errors.username}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
            />
            <TextArea
              label="Bio"
              value={form.bio}
              onChangeText={(v) => set({ bio: v.slice(0, BIO_MAX) })}
              placeholder="Tell people about yourself"
              maxLength={BIO_MAX}
            />
            <Text style={styles.helper}>
              {form.bio.length}/{BIO_MAX}
            </Text>
            <TextInput label="City" value={form.city} onChangeText={(v) => set({ city: v })} />
            <CountryField
              label="Location (country)"
              title="Where do you live?"
              value={form.countryCode}
              placeholder={form.countryText || 'Choose country'}
              onChange={(c) => set({ countryCode: c?.code ?? null, countryText: c?.name ?? '' })}
            />
            {athlete ? null : (
              <TextInput
                label="Age"
                value={form.age}
                onChangeText={(v) => set({ age: digits(v) })}
                error={errors.age}
                keyboardType="number-pad"
                maxLength={3}
              />
            )}

            <View style={styles.block}>
              <Text style={styles.groupLabel}>GENDER</Text>
              <View style={styles.genderRow} accessibilityRole="radiogroup">
                {GENDERS.map((g) => (
                  <Button
                    key={g.value}
                    size="small"
                    type={form.gender === g.value ? 'primary' : 'gray'}
                    label={g.label}
                    onPress={() => set({ gender: form.gender === g.value ? '' : g.value })}
                    style={styles.genderOption}
                  />
                ))}
              </View>
            </View>
          </View>

          {athlete ? (
            <>
              <View style={styles.fields}>
                <Text style={styles.section} accessibilityRole="header">
                  Player info
                </Text>
                <DateField
                  label="Date of birth"
                  sheetTitle="Date of birth"
                  yearsBack={60}
                  value={info.birth_date}
                  onChange={(v) => setI({ birth_date: v })}
                />
                <CountryField
                  label="Nationality"
                  title="Nationality"
                  value={info.nationalityCode}
                  onChange={(c) => setI({ nationalityCode: c?.code ?? null })}
                />
                <View style={styles.pair}>
                  <TextInput
                    label="Height (cm)"
                    value={info.height_cm}
                    onChangeText={(v) => setI({ height_cm: digits(v) })}
                    error={errors.height}
                    keyboardType="number-pad"
                    maxLength={3}
                    style={styles.flex}
                  />
                  <TextInput
                    label="Weight (kg)"
                    value={info.weight_kg}
                    onChangeText={(v) => setI({ weight_kg: digits(v) })}
                    error={errors.weight}
                    keyboardType="number-pad"
                    maxLength={3}
                    style={styles.flex}
                  />
                </View>
                <TextInput
                  label="Shirt number"
                  value={info.shirt_number}
                  onChangeText={(v) => setI({ shirt_number: digits(v) })}
                  error={errors.shirt}
                  keyboardType="number-pad"
                  maxLength={2}
                />
                <SelectField
                  label="Playing style"
                  title="Playing style"
                  placeholder="Choose your style"
                  value={info.playing_style}
                  options={STYLE_OPTIONS}
                  onChange={(v) => setI({ playing_style: v })}
                />
                <View style={styles.block}>
                  <Text style={styles.groupLabel}>PREFERRED FOOT</Text>
                  <ChipGroup
                    options={FEET}
                    value={info.preferred_foot}
                    onChange={(v) => setI({ preferred_foot: info.preferred_foot === v ? null : v })}
                  />
                </View>
                <View style={styles.block}>
                  <Text style={styles.groupLabel}>INJURED</Text>
                  <ChipGroup options={INJURED} value={info.injured} onChange={(v) => setI({ injured: info.injured === v ? null : v })} />
                </View>
              </View>

              <View style={styles.fields}>
                <Text style={styles.section} accessibilityRole="header">
                  Career history
                </Text>
                <HistoryRows
                  rows={experienceRows}
                  onOpen={(id) => router.push({ pathname: '/profile/experience', params: { id } })}
                  addLabel="Add club"
                  onAdd={() => router.push('/profile/experience')}
                />
              </View>

              <View style={styles.fields}>
                <Text style={styles.section} accessibilityRole="header">
                  National team history
                </Text>
                <HistoryRows
                  rows={nationalRows}
                  onOpen={(id) => router.push({ pathname: '/profile/national-team', params: { id } })}
                  addLabel="Add national team"
                  onAdd={() => router.push('/profile/national-team')}
                />
              </View>
            </>
          ) : null}

          {saveError ? <Text style={styles.error}>{saveError}</Text> : null}

          <View style={styles.actions}>
            <Button size="big" type="primary" label={saving ? 'Saving…' : 'Save changes'} onPress={save} disabled={saving} />
            <Button size="big" type="outlined" label="Cancel" onPress={() => router.back()} disabled={saving} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.neutral.bg },
  flex: { flex: 1 },
  content: { padding: 16, gap: 32 },
  avatar: { alignSelf: 'center', alignItems: 'center', gap: 8, paddingTop: 8 },
  changePhoto: { fontFamily: fonts.medium, fontSize: 12, color: colors.primary.default },
  fields: { gap: 16 },
  section: { fontFamily: fonts.semibold, fontSize: 18, color: colors.black },
  helper: { marginTop: -12, fontFamily: fonts.regular, fontSize: 12, color: colors.neutral[700], textAlign: 'right' },
  block: { gap: 8 },
  pair: { flexDirection: 'row', gap: 12 },
  groupLabel: { fontFamily: fonts.medium, fontSize: 12, letterSpacing: 0.3, color: colors.neutral[700] },
  genderRow: { flexDirection: 'row', gap: 8 },
  genderOption: { flex: 1 },
  history: { borderRadius: 12, backgroundColor: colors.white, overflow: 'hidden' },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  pressed: { backgroundColor: colors.neutral.bg },
  historyLogo: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  flag: { fontSize: 20, lineHeight: 24 },
  historyText: { flex: 1, gap: 2 },
  historyName: { fontFamily: fonts.medium, fontSize: 14, color: colors.black },
  historyDate: { fontFamily: fonts.medium, fontSize: 12, color: '#72717a' },
  addRow: { alignSelf: 'flex-start', marginVertical: 6, marginHorizontal: 4 },
  error: { fontFamily: fonts.regular, fontSize: 14, color: colors.negative.default },
  actions: { gap: 12 },
});
