import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { CaretDown, Images, Play, Warning } from 'phosphor-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import StepHeader from '@/components/onboarding/StepHeader';
import BottomSheet from '@/components/ui/BottomSheet';
import TextArea from '@/components/ui/TextArea';
import { colors, fonts, radius } from '@/theme';

/**
 * First highlight post (optional). `media` is { uri, type: 'image'|'video', mimeType }.
 * The wizard uploads it when the user taps Post.
 */
export default function AddHighlight({ media, text, match, onMediaChange, onTextChange, onMatchChange, matches = [] }) {
  const [showMatches, setShowMatches] = useState(false);

  async function pick() {
    await ImagePicker.requestMediaLibraryPermissionsAsync();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.8,
    });
    if (result.canceled) return;
    const a = result.assets[0];
    onMediaChange({ uri: a.uri, type: a.type === 'video' ? 'video' : 'image', mimeType: a.mimeType });
  }

  return (
    <View style={styles.root}>
      <StepHeader title="Add your first highlight" subtitle="Share your last game" />

      {media ? (
        <View style={styles.preview}>
          {media.type === 'video' ? (
            <View style={[StyleSheet.absoluteFill, styles.videoPlaceholder]} />
          ) : (
            <Image source={{ uri: media.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
          )}
          {media.type === 'video' ? (
            <View style={styles.playBtn}>
              <Play size={22} weight="fill" color={colors.white} />
            </View>
          ) : null}
          <Pressable
            onPress={() => onMediaChange(null)}
            accessibilityRole="button"
            accessibilityLabel="Remove media"
            style={styles.removeBtn}>
            <Text style={styles.removeText}>Remove</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={pick}
          accessibilityRole="button"
          accessibilityLabel="Choose media from gallery"
          style={({ pressed }) => [styles.upload, pressed && styles.pressed]}>
          <View style={styles.uploadIcon}>
            <Images size={24} weight="bold" color={colors.primary.default} />
          </View>
          <Text style={styles.uploadLabel}>Gallery</Text>
          <Text style={styles.uploadSub}>Choose from library</Text>
        </Pressable>
      )}

      <TextArea
        label="Add text"
        placeholder="Describe your moment..."
        value={text}
        onChangeText={onTextChange}
      />

      <Pressable
        onPress={() => setShowMatches(true)}
        accessibilityRole="button"
        style={({ pressed }) => [styles.matchBtn, pressed && styles.pressed]}>
        <Text style={[styles.matchLabel, !match && styles.matchPlaceholder]}>{match || 'Select match'}</Text>
        <CaretDown size={18} weight="bold" color={colors.neutral[700]} />
      </Pressable>

      <BottomSheet visible={showMatches} onClose={() => setShowMatches(false)} title="Select match">
        {matches.length > 0 ? (
          <View style={styles.matchList}>
            {matches.map((m) => (
              <Pressable
                key={m.value}
                onPress={() => {
                  onMatchChange(m.value);
                  setShowMatches(false);
                }}
                style={[styles.matchItem, match === m.value && styles.matchItemSelected]}>
                <Text style={styles.matchItemLabel}>{m.label}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.matchEmpty}>
            <Warning size={32} color={colors.neutral[500]} />
            <Text style={styles.matchEmptyText}>No matches to select</Text>
          </View>
        )}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 16 },
  upload: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary[200],
    backgroundColor: colors.white,
  },
  uploadIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  uploadLabel: { fontFamily: fonts.semibold, fontSize: 16, color: colors.black },
  uploadSub: { fontFamily: fonts.regular, fontSize: 14, color: colors.neutral[700] },
  pressed: { opacity: 0.8 },
  preview: {
    height: 240,
    borderRadius: radius.md,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlaceholder: { backgroundColor: colors.black },
  playBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  removeText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.white },
  matchBtn: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    backgroundColor: colors.white,
  },
  matchLabel: { fontFamily: fonts.medium, fontSize: 16, color: colors.black },
  matchPlaceholder: { color: colors.neutral[700] },
  matchList: { gap: 8, paddingBottom: 8 },
  matchItem: { padding: 14, borderRadius: radius.sm, backgroundColor: colors.white },
  matchItemSelected: { borderWidth: 1.5, borderColor: colors.primary.default },
  matchItemLabel: { fontFamily: fonts.medium, fontSize: 16, color: colors.black },
  matchEmpty: { alignItems: 'center', gap: 8, paddingVertical: 24 },
  matchEmptyText: { fontFamily: fonts.medium, fontSize: 16, color: colors.neutral[700] },
});
