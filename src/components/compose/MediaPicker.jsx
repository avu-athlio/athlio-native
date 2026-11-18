import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Images, Plus, X } from 'phosphor-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/theme';

const MAX_IMAGES = 10;
let nextId = 0;

// Opens the library (images only: the feed doesn't play video yet).
// Returns [{ id, uri, mimeType }] or [] if cancelled.
export async function pickImages(limit = MAX_IMAGES) {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: limit > 1,
    selectionLimit: limit,
    orderedSelection: true,
    quality: 0.8,
  });
  if (result.canceled) return [];
  return result.assets.map((a) => ({ id: `img-${nextId++}`, uri: a.uri, mimeType: a.mimeType }));
}

/**
 * Figma "Create new post" media area:
 * 0 photos → grey "Add video or photo" tile; 1 → full-width photo (204 tall);
 * 2+ → horizontal strip of 257×192 photos. Each photo has a dark round ✕;
 * a round + (next to the ✕ on a single photo, a tile at the end of the strip) adds more.
 */
export default function MediaPicker({ images, onChange }) {
  const add = async () => {
    const picked = await pickImages(MAX_IMAGES - images.length);
    if (picked.length) onChange([...images, ...picked]);
  };
  const remove = (id) => onChange(images.filter((x) => x.id !== id));
  const canAdd = images.length < MAX_IMAGES;

  if (!images.length) return <EmptyTile onPress={add} />;

  if (images.length === 1) {
    const [img] = images;
    return (
      <View style={styles.single}>
        <Image source={{ uri: img.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
        <View style={styles.actions}>
          {canAdd ? <RoundButton icon={Plus} label="Add more photos" onPress={add} /> : null}
          <RoundButton icon={X} label="Remove photo" onPress={() => remove(img.id)} />
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.stripScroll}
      contentContainerStyle={styles.strip}>
      {images.map((img, i) => (
        <View key={img.id} style={styles.thumb}>
          <Image source={{ uri: img.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
          <View style={styles.actions}>
            <RoundButton icon={X} label={`Remove photo ${i + 1}`} onPress={() => remove(img.id)} />
          </View>
        </View>
      ))}
      {canAdd ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Add more photos" onPress={add} style={styles.addTile}>
          <Plus size={24} color={colors.primary.default} />
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

export function EmptyTile({ onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Add photo, choose from library"
      onPress={onPress}
      style={({ pressed }) => [styles.empty, pressed && styles.emptyPressed]}>
      <View style={styles.emptyIcon}>
        <Images size={24} color={colors.primary.default} />
      </View>
      <Text style={styles.emptyTitle}>Add video or photo</Text>
      <Text style={styles.emptySub}>Choose from library</Text>
    </Pressable>
  );
}

function RoundButton({ icon: Icon, label, onPress }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} hitSlop={6} onPress={onPress} style={styles.round}>
      <Icon size={20} color={colors.white} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  empty: {
    height: 177,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 12,
    backgroundColor: colors.neutral[200],
  },
  emptyPressed: { backgroundColor: colors.neutral[300] },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[200],
  },
  emptyTitle: { fontFamily: fonts.semibold, fontSize: 18, color: colors.black },
  emptySub: { fontFamily: fonts.medium, fontSize: 16, color: colors.neutral[700] },

  single: { height: 204, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.neutral[100] },
  actions: { position: 'absolute', top: 6, right: 6, flexDirection: 'row', gap: 6 },
  round: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(21,22,34,0.5)',
  },

  // Bleeds to the right screen edge, as in the design.
  stripScroll: { marginRight: -16 },
  strip: { gap: 8, paddingRight: 16 },
  thumb: { width: 257, height: 192, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.neutral[100] },
  addTile: {
    width: 96,
    height: 192,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary[200],
  },
});
