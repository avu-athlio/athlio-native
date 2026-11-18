import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { X } from 'phosphor-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PageTopbar } from '@/components/navigation/Topbar';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import TextArea from '@/components/ui/TextArea';
import TextInput from '@/components/ui/TextInput';
import { useUser } from '@/context/UserContext';
import { isUsernameTaken, saveProfile } from '@/lib/profile';
import { colors, fonts } from '@/theme';

const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];
const BIO_MAX = 150;
const USERNAME_RE = /^[a-z0-9._]{3,30}$/;

// Port of pages/ProfileEdit (same fields). Gender is a choice instead of free
// text, and the username is checked for format and collisions before saving.
export default function EditProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile, setProfile } = useUser();

  const [form, setForm] = useState(() => ({
    full_name: profile?.full_name ?? '',
    username: profile?.username ?? '',
    bio: profile?.bio ?? '',
    city: profile?.city ?? '',
    country: profile?.country ?? '',
    age: profile?.age != null ? String(profile.age) : '',
    gender: profile?.gender ?? '',
  }));
  const [avatar, setAvatar] = useState(null); // newly picked { uri, mimeType }
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

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
    if (form.age && !/^\d{1,3}$/.test(form.age.trim())) next.age = 'Enter a number.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    setSaveError('');
    try {
      if (username !== profile?.username && (await isUsernameTaken(username, user.id))) {
        setErrors({ username: 'That username is taken.' });
        return;
      }
      const saved = await saveProfile(
        user.id,
        {
          full_name: form.full_name.trim(),
          username,
          bio: form.bio.trim() || null,
          city: form.city.trim() || null,
          country: form.country.trim() || null,
          age: form.age.trim() ? parseInt(form.age, 10) : null,
          gender: form.gender || null,
        },
        avatar,
      );
      setProfile(saved);
      router.back();
    } catch (e) {
      setSaveError(e?.message ?? 'Could not save. Try again.');
    } finally {
      setSaving(false);
    }
  };

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
            <TextInput label="Country" value={form.country} onChangeText={(v) => set({ country: v })} />
            <TextInput
              label="Age"
              value={form.age}
              onChangeText={(v) => set({ age: v.replace(/\D/g, '') })}
              error={errors.age}
              keyboardType="number-pad"
              maxLength={3}
            />

            <View style={styles.genderBlock}>
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
  content: { padding: 16, gap: 24 },
  avatar: { alignSelf: 'center', alignItems: 'center', gap: 8, paddingTop: 8 },
  changePhoto: { fontFamily: fonts.medium, fontSize: 12, color: colors.primary.default },
  fields: { gap: 16 },
  helper: { marginTop: -12, fontFamily: fonts.regular, fontSize: 12, color: colors.neutral[700], textAlign: 'right' },
  genderBlock: { gap: 8 },
  groupLabel: { fontFamily: fonts.medium, fontSize: 12, letterSpacing: 0.3, color: colors.neutral[700] },
  genderRow: { flexDirection: 'row', gap: 8 },
  genderOption: { flex: 1 },
  error: { fontFamily: fonts.regular, fontSize: 14, color: colors.negative.default },
  actions: { gap: 12 },
});
