import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Plus, UserCircle } from 'phosphor-react-native';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import StepHeader from '@/components/onboarding/StepHeader';
import { colors, fonts } from '@/theme';

// Name + avatar. The picker's built-in square crop replaces the web crop modal.
// `avatarUrl` is a local file:// URI until the wizard uploads it on finish.
export default function NameAndPhoto({ name, avatarUrl, onNameChange, onAvatarChange }) {
  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    onAvatarChange?.({ uri: asset.uri, mimeType: asset.mimeType });
  }

  return (
    <View style={styles.root}>
      <StepHeader title="What is your name?" subtitle="Use your real name and a clear photo." />

      <View style={styles.body}>
        <View style={styles.avatarWrap}>
          <Pressable
            onPress={pickPhoto}
            accessibilityRole="button"
            accessibilityLabel="Upload profile photo"
            style={({ pressed }) => [styles.avatarCircle, pressed && styles.pressed]}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImg} contentFit="cover" />
            ) : (
              <UserCircle size={72} weight="thin" color={colors.neutral[400]} />
            )}
          </Pressable>
          <Pressable
            onPress={pickPhoto}
            accessibilityRole="button"
            accessibilityLabel="Add photo"
            style={({ pressed }) => [styles.addBadge, pressed && styles.pressed]}>
            <Plus size={20} weight="bold" color={colors.white} />
          </Pressable>
        </View>

        <TextInput
          value={name}
          onChangeText={onNameChange}
          placeholder="e.g. N'Golo Kanté"
          placeholderTextColor={colors.neutral[300]}
          autoComplete="name"
          textContentType="name"
          autoCapitalize="words"
          autoCorrect={false}
          spellCheck={false}
          autoFocus={!name}
          returnKeyType="done"
          accessibilityLabel="Your name"
          style={styles.nameInput}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 36 },
  avatarWrap: { width: 132, height: 132 },
  avatarCircle: {
    width: 132,
    height: 132,
    borderRadius: 66,
    padding: 4,
    backgroundColor: colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%', borderRadius: 62 },
  addBadge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary.default,
    borderWidth: 2.5,
    borderColor: colors.neutral.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.75 },
  nameInput: {
    alignSelf: 'stretch',
    fontFamily: fonts.condensedBold,
    fontSize: 40,
    lineHeight: 44,
    color: colors.black,
    textAlign: 'center',
    padding: 0,
  },
});
