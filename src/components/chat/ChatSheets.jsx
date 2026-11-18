import { Image } from 'expo-image';
import { ArrowBendUpLeft, Bell, BellSlash, Copy, PencilSimple, Prohibit, ShareNetwork, Trash, X } from 'phosphor-react-native';
import { useState } from 'react';
import { FlatList, Modal, Pressable, Share, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { THEMES } from '@/components/chat/chatShared';
import Avatar from '@/components/ui/Avatar';
import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/ui/Button';
import { colors, fonts } from '@/theme';

/** Figma chat "Settings": person, Visit profile / Mute / Block, Themes. */
export function ChatSettingsSheet({ visible, onClose, other, muted, blockedByMe, theme, onVisitProfile, onToggleMute, onToggleBlock, onTheme }) {
  const name = other?.full_name || other?.username || '';
  return (
    <BottomSheet variant="popover" visible={visible} onClose={onClose} title="Settings">
      <View style={styles.person}>
        <Avatar uri={other?.avatar_url} size="medium" verified={other?.verified} />
        <Text style={styles.personName} numberOfLines={1}>
          {name}
        </Text>
      </View>
      <View style={styles.actions}>
        <Button size="small" type="primary" label="Visit Profile" onPress={onVisitProfile} style={styles.action} />
        <Button
          size="small"
          type="outlined"
          label={muted ? 'Unmute' : 'Mute'}
          leadingIcon={muted ? Bell : BellSlash}
          onPress={onToggleMute}
          style={styles.action}
        />
        <Pressable
          accessibilityRole="button"
          onPress={onToggleBlock}
          style={({ pressed }) => [styles.block, pressed && styles.pressed]}>
          <Prohibit size={18} color={colors.negative.default} />
          <Text style={styles.blockText}>{blockedByMe ? 'Unblock' : 'Block'}</Text>
        </Pressable>
      </View>

      <Text style={styles.heading}>Themes</Text>
      <View style={styles.themes}>
        {THEMES.map((t) => {
          const selected = t.id === theme;
          return (
            <View key={t.id} style={styles.themeRow}>
              <View style={styles.themeLeft}>
                {t.thumb ? (
                  <Image source={t.thumb} style={styles.thumb} contentFit="contain" />
                ) : (
                  <View style={[styles.thumb, styles.thumbDefault]} />
                )}
                <Text style={styles.themeName}>{t.label}</Text>
              </View>
              <Button
                size="xsmall"
                type={selected ? 'primary' : 'subtle'}
                label={selected ? 'Selected' : 'Select'}
                onPress={() => !selected && onTheme(t.id)}
              />
            </View>
          );
        })}
      </View>
    </BottomSheet>
  );
}

/** Long-press actions on a message (Figma overlay: Edit, Reply, Delete). */
export function MessageActionsSheet({ message, mine, onClose, onReply, onEdit, onDelete, onCopy }) {
  const rows = message
    ? [
        { key: 'reply', label: 'Reply', icon: ArrowBendUpLeft, run: onReply },
        mine && message.body ? { key: 'edit', label: 'Edit', icon: PencilSimple, run: onEdit } : null,
        message.body ? { key: 'copy', label: 'Copy', icon: Copy, run: onCopy } : null,
        mine ? { key: 'delete', label: 'Delete', icon: Trash, run: onDelete, danger: true } : null,
      ].filter(Boolean)
    : [];
  return (
    <BottomSheet variant="handle" visible={!!message} onClose={onClose}>
      <View style={styles.menu}>
        {rows.map((r) => (
          <Pressable
            key={r.key}
            accessibilityRole="button"
            onPress={() => {
              onClose();
              r.run(message);
            }}
            style={({ pressed }) => [styles.menuRow, pressed && styles.menuPressed]}>
            <View style={styles.menuIcon}>
              <r.icon size={16} color={r.danger ? colors.negative.default : colors.black} />
            </View>
            <Text style={[styles.menuText, r.danger && styles.danger]}>{r.label}</Text>
          </Pressable>
        ))}
      </View>
    </BottomSheet>
  );
}

/** Full-screen photos ("1 of 3"), swipe between them, share. */
export function PhotoViewer({ photos, onClose }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const open = !!photos;

  // Start on the tapped photo each time it opens.
  const [shownFor, setShownFor] = useState(null);
  if (photos !== shownFor) {
    setShownFor(photos);
    if (photos) setIndex(photos.start);
  }

  return (
    <Modal visible={open} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.viewer, { paddingTop: insets.top }]}>
        <View style={styles.viewerBar}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" hitSlop={8} onPress={onClose}>
            <X size={24} color={colors.black} />
          </Pressable>
          <Text style={styles.viewerCount}>{open ? `${index + 1} of ${photos.urls.length}` : ''}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Share photo"
            hitSlop={8}
            onPress={() => open && Share.share({ url: photos.urls[index] }).catch(() => {})}>
            <ShareNetwork size={24} color={colors.black} />
          </Pressable>
        </View>
        {open ? (
          <FlatList
            data={photos.urls}
            horizontal
            pagingEnabled
            initialScrollIndex={photos.start}
            getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
            showsHorizontalScrollIndicator={false}
            keyExtractor={(u, i) => `${i}-${u}`}
            onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
            renderItem={({ item }) => (
              <View style={{ width, flex: 1, justifyContent: 'center', paddingHorizontal: 16 }}>
                <Image source={{ uri: item }} style={styles.viewerImage} contentFit="contain" />
              </View>
            )}
          />
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  person: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  personName: { fontFamily: fonts.semibold, fontSize: 14, color: colors.black, flexShrink: 1 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 16 },
  action: { flex: 1 },
  block: {
    flex: 1,
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.negative.default,
  },
  blockText: { fontFamily: fonts.semibold, fontSize: 16, color: colors.negative.default },
  pressed: { opacity: 0.7 },
  heading: { fontFamily: fonts.semibold, fontSize: 16, color: colors.black, marginTop: 24, marginBottom: 12 },
  themes: { gap: 8 },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 6,
    paddingRight: 8,
    borderRadius: 8,
    backgroundColor: colors.neutral.bg,
  },
  themeLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  thumb: { width: 47, height: 47, borderRadius: 8 },
  thumbDefault: { backgroundColor: colors.neutral[200] },
  themeName: { fontFamily: fonts.medium, fontSize: 14, color: colors.black },

  menu: { gap: 4 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, borderRadius: 8 },
  menuPressed: { backgroundColor: colors.neutral.bg },
  menuIcon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  menuText: { fontFamily: fonts.medium, fontSize: 16, color: colors.black },
  danger: { color: colors.negative.default },

  viewer: { flex: 1, backgroundColor: colors.white },
  viewerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  viewerCount: { fontFamily: fonts.medium, fontSize: 16, color: colors.black },
  viewerImage: { flex: 1, width: '100%' },
});
