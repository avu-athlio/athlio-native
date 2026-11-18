import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import MediaPicker, { pickImages } from '@/components/compose/MediaPicker';
import { NotchLabel } from '@/components/compose/Pickers';
import MatchCard from '@/components/post/MatchCard';
import { colors, fonts } from '@/theme';

/**
 * The "post about a match" body shared by PostAboutMatch and Add match's
 * "Make a post" sheet. Follows the Figma states:
 * 0 photos → match summary + "Add video or photo" tile;
 * 1 photo  → "Change photo" + the full match card with the photo inside;
 * 2+       → match summary + photo strip.
 */
export default function MatchPostEditor({ card, images, onImagesChange, caption, onCaptionChange }) {
  const single = images.length === 1;

  const changePhoto = async () => {
    const [img] = await pickImages(1);
    if (img) onImagesChange([img]);
  };

  return (
    <View style={styles.root}>
      {single ? (
        <View>
          <Pressable accessibilityRole="button" onPress={changePhoto} hitSlop={8} style={styles.changePhoto}>
            <Text style={styles.changePhotoText}>Change photo</Text>
          </Pressable>
          <MatchCard {...card} imageUrl={images[0].uri} />
          <Pressable accessibilityRole="button" onPress={() => onImagesChange([])} hitSlop={8} style={styles.removeLink}>
            <Text style={styles.removeText}>Remove photo</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <MatchCard {...card} summary />
          <MediaPicker images={images} onChange={onImagesChange} />
        </>
      )}

      <CaptionField value={caption} onChangeText={onCaptionChange} />
    </View>
  );
}

// Figma "Add text" caption box: white, label notched into the top border.
export function CaptionField({ value, onChangeText, minHeight = 149 }) {
  const [focused, setFocused] = useState(false);
  return (
    <View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Add a caption..."
        placeholderTextColor={colors.neutral[700]}
        multiline
        textAlignVertical="top"
        accessibilityLabel="Add text"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[styles.textarea, { minHeight }, focused && styles.textareaFocused]}
      />
      <NotchLabel label="Add text" color={value ? colors.neutral[600] : colors.black} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 16 },
  changePhoto: { alignSelf: 'flex-end', marginBottom: 8 },
  changePhotoText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.primary.default },
  removeLink: { alignSelf: 'flex-start', marginTop: 8 },
  removeText: { fontFamily: fonts.medium, fontSize: 14, color: colors.neutral[700] },
  textarea: {
    paddingHorizontal: 12,
    paddingTop: 13,
    paddingBottom: 13,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    borderRadius: 8,
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.black,
    backgroundColor: colors.white,
  },
  textareaFocused: { borderColor: colors.primary.default },
});
