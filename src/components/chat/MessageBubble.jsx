import { Image } from 'expo-image';
import { Eye } from 'phosphor-react-native';
import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CHAT, clockTime, useSignedUrls } from '@/components/chat/chatShared';
import { colors, fonts } from '@/theme';

const EMPTY = [];

function Photos({ msg, mine, onOpen }) {
  const paths = useMemo(() => msg.image_paths ?? EMPTY, [msg.image_paths]);
  const remote = useSignedUrls(msg.localImages ? EMPTY : paths);
  const urls = msg.localImages ? msg.localImages.map((i) => i.uri) : remote;
  const count = msg.localImages?.length ?? paths.length;
  if (!count) return null;

  if (count === 1) {
    return (
      <Pressable accessibilityRole="imagebutton" accessibilityLabel="Photo" onPress={() => urls[0] && onOpen(urls, 0)}>
        <Image source={urls[0] ? { uri: urls[0] } : null} style={[styles.single, !mine && styles.photoTheirs]} contentFit="cover" />
      </Pressable>
    );
  }
  const shown = Array.from({ length: Math.min(count, 4) }, (_, i) => i);
  return (
    <View style={styles.grid}>
      {shown.map((i) => (
        <Pressable
          key={i}
          accessibilityRole="imagebutton"
          accessibilityLabel={`Photo ${i + 1} of ${count}`}
          onPress={() => urls[i] && onOpen(urls, i)}>
          <Image source={urls[i] ? { uri: urls[i] } : null} style={[styles.cell, !mine && styles.photoTheirs]} contentFit="cover" />
          {i === 3 && count > 4 ? (
            <View style={styles.more}>
              <Text style={styles.moreText}>+{count - 4}</Text>
            </View>
          ) : null}
        </Pressable>
      ))}
    </View>
  );
}

/**
 * One message (Figma chat bubble). Mine: dark blue, right; theirs: light blue,
 * left. Long-press opens the actions. `showMeta` shows the time (and "Seen"
 * on my latest seen message) under the bubble.
 */
function MessageBubble({ msg, mine, showMeta, seen, reply, replyName, onLongPress, onOpenPhotos, onRetry }) {
  const deleted = !!msg.deleted_at;
  const hasPhotos = !deleted && ((msg.localImages?.length ?? 0) > 0 || (msg.image_paths?.length ?? 0) > 0);
  const textColor = mine ? CHAT.mineText : CHAT.theirsText;

  return (
    <View style={[styles.wrap, mine ? styles.wrapMine : styles.wrapTheirs]}>
      <Pressable
        onLongPress={deleted || msg.pending ? undefined : () => onLongPress(msg)}
        delayLongPress={300}
        onPress={msg.failed ? () => onRetry(msg) : undefined}
        accessibilityHint={deleted ? undefined : 'Long press for reply, edit or delete'}
        style={[
          styles.bubble,
          mine ? styles.mine : styles.theirs,
          hasPhotos && styles.withPhotos,
          deleted && styles.deleted,
          msg.pending && styles.pending,
        ]}>
        {reply ? (
          <View style={[styles.quote, mine ? styles.quoteMine : styles.quoteTheirs]}>
            <Text style={[styles.quoteName, { color: textColor }]} numberOfLines={1}>
              {replyName}
            </Text>
            <Text style={[styles.quoteText, { color: textColor }]} numberOfLines={2}>
              {reply.deleted_at ? 'Message deleted' : reply.body || 'Photo'}
            </Text>
          </View>
        ) : null}
        {deleted ? (
          <Text style={[styles.body, styles.deletedText]}>Message deleted</Text>
        ) : (
          <>
            {hasPhotos ? <Photos msg={msg} mine={mine} onOpen={onOpenPhotos} /> : null}
            {msg.body ? (
              <Text style={[styles.body, { color: textColor }, hasPhotos && styles.bodyUnderPhotos]} selectable>
                {msg.body}
              </Text>
            ) : null}
          </>
        )}
      </Pressable>

      {msg.failed ? (
        <Text style={styles.failed}>Not sent · Tap to retry</Text>
      ) : showMeta || seen ? (
        <View style={styles.meta}>
          {seen ? (
            <View style={styles.seen}>
              <Eye size={16} color={CHAT.meta} />
              <Text style={styles.seenText}>Seen</Text>
            </View>
          ) : null}
          {msg.edited_at && !deleted ? <Text style={styles.time}>Edited</Text> : null}
          <Text style={styles.time}>{msg.pending ? 'Sending…' : clockTime(msg.created_at)}</Text>
        </View>
      ) : null}
    </View>
  );
}

export default memo(MessageBubble);

const styles = StyleSheet.create({
  wrap: { gap: 4, paddingVertical: 2 },
  wrapMine: { alignItems: 'flex-end' },
  wrapTheirs: { alignItems: 'flex-start' },
  bubble: { maxWidth: '78%', padding: 14, borderRadius: 24 },
  mine: { backgroundColor: CHAT.mine, borderBottomRightRadius: 8 },
  theirs: { backgroundColor: CHAT.theirs, borderBottomLeftRadius: 8 },
  withPhotos: { padding: 6 },
  pending: { opacity: 0.6 },
  deleted: { backgroundColor: 'transparent', borderWidth: 1, borderColor: CHAT.chipBorder },
  body: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 18 },
  bodyUnderPhotos: { paddingHorizontal: 8, paddingTop: 8, paddingBottom: 6 },
  deletedText: { fontStyle: 'italic', color: CHAT.meta },
  quote: { borderLeftWidth: 3, paddingLeft: 8, paddingVertical: 2, marginBottom: 8, borderRadius: 2 },
  quoteMine: { borderLeftColor: 'rgba(251,251,251,0.6)' },
  quoteTheirs: { borderLeftColor: CHAT.mine },
  quoteName: { fontFamily: fonts.semibold, fontSize: 12, opacity: 0.9 },
  quoteText: { fontFamily: fonts.regular, fontSize: 12, opacity: 0.8 },
  single: { width: 210, height: 250, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)' },
  photoTheirs: { backgroundColor: 'rgba(38,49,160,0.12)' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, width: 248 },
  cell: { width: 122, height: 145, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)' },
  more: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,2,21,0.45)',
  },
  moreText: { fontFamily: fonts.semibold, fontSize: 20, color: colors.white },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  seen: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  seenText: { fontFamily: fonts.regular, fontSize: 12, color: CHAT.meta },
  time: { fontFamily: fonts.regular, fontSize: 12, color: CHAT.time },
  failed: { fontFamily: fonts.medium, fontSize: 12, color: colors.negative.default, paddingHorizontal: 4 },
});
