import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/theme';

// Post text clamped to 3 lines with "See more" / "See less" when it overflows.
const MAX_LINES = 3;

export default function PostCaption({ content }) {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const [measured, setMeasured] = useState(false);

  if (!content) return null;

  return (
    <View style={styles.wrap}>
      {/* Invisible full-length copy, measured once to know if the text overflows. */}
      {!measured ? (
        <Text
          style={[styles.text, styles.measure]}
          onTextLayout={(e) => {
            setOverflows(e.nativeEvent.lines.length > MAX_LINES);
            setMeasured(true);
          }}
          aria-hidden
          importantForAccessibility="no-hide-descendants">
          {content}
        </Text>
      ) : null}
      <Text style={styles.text} numberOfLines={expanded ? undefined : MAX_LINES}>
        {content}
      </Text>
      {overflows ? (
        <Pressable onPress={() => setExpanded((v) => !v)} hitSlop={6} accessibilityRole="button">
          <Text style={styles.more}>{expanded ? 'See less' : 'See more'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch' },
  text: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 18, color: colors.neutral[950] },
  measure: { position: 'absolute', opacity: 0, left: 0, right: 0 },
  more: { marginTop: 4, fontFamily: fonts.medium, fontSize: 14, color: colors.primary.default },
});
