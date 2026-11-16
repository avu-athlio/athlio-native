import { Image } from 'expo-image';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { colors } from '@/theme';

// Port of the web MediaCarousel: one image full width (natural aspect, max
// 400 tall), several images as a horizontal strip of 260×260 tiles.
const MAX_HEIGHT = 400;

export default function MediaCarousel({ urls = [] }) {
  if (!urls.length) return null;
  if (urls.length === 1) return <SingleImage uri={urls[0]} />;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.strip}
      contentContainerStyle={styles.stripContent}>
      {urls.map((uri, i) => (
        <View key={`${uri}-${i}`} style={styles.tile}>
          <Image source={{ uri }} style={styles.fill} contentFit="cover" transition={150} />
        </View>
      ))}
    </ScrollView>
  );
}

function SingleImage({ uri }) {
  const [ratio, setRatio] = useState(4 / 3);
  const [width, setWidth] = useState(0);
  const height = width ? Math.min(width / ratio, MAX_HEIGHT) : undefined;

  return (
    <View style={styles.single} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <Image
        source={{ uri }}
        style={[styles.singleImage, height ? { height } : { aspectRatio: ratio }]}
        contentFit="cover"
        transition={150}
        onLoad={(e) => {
          const { width: w, height: h } = e.source ?? {};
          if (w && h) setRatio(w / h);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  single: { alignSelf: 'stretch' },
  singleImage: { width: '100%', borderRadius: 12, backgroundColor: colors.neutral[100] },
  strip: { alignSelf: 'stretch' },
  stripContent: { gap: 8, paddingHorizontal: 2, paddingBottom: 2 },
  tile: { width: 260, height: 260, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.neutral[100] },
  fill: { width: '100%', height: '100%' },
});
