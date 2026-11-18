import { Image } from 'expo-image';
import { Basketball, Camera, Image as ImageIcon, PaperPlaneTilt, PencilSimple, Plus, SoccerBall, Volleyball, X } from 'phosphor-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { CHAT } from '@/components/chat/chatShared';
import { colors, fonts } from '@/theme';

function RoundButton({ icon: Icon, label, onPress, primary = false, disabled = false }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={4}
      onPress={onPress}
      style={({ pressed }) => [
        styles.round,
        primary ? styles.roundPrimary : styles.roundPlain,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}>
      <Icon size={20} color={primary ? colors.white : colors.black} weight={primary ? 'fill' : 'regular'} />
    </Pressable>
  );
}

// Figma "Typing" row with the three balls.
export function TypingIndicator() {
  return (
    <View style={styles.typing} accessibilityLiveRegion="polite" accessibilityLabel="Typing">
      <Text style={styles.typingText}>Typing</Text>
      <SoccerBall size={16} color={CHAT.meta} />
      <Volleyball size={16} color={CHAT.meta} />
      <Basketball size={16} color={CHAT.meta} />
    </View>
  );
}

/**
 * Figma message composer. `banner` = { kind: 'reply' | 'edit', title, text } shows
 * above the input with ✕ to cancel. `images` = photos waiting to be sent.
 */
export default function Composer({
  value,
  onChangeText,
  onSend,
  onPickPhotos,
  onTakePhoto,
  images,
  onRemoveImage,
  banner,
  onCancelBanner,
  busy,
}) {
  const [menu, setMenu] = useState(false);
  const canSend = !busy && (value.trim().length > 0 || images.length > 0);
  const editing = banner?.kind === 'edit';

  return (
    <View style={styles.card}>
      {banner ? (
        <View style={styles.banner}>
          {editing ? <PencilSimple size={16} color={CHAT.mine} /> : null}
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle} numberOfLines={1}>
              {banner.title}
            </Text>
            <Text style={styles.bannerBody} numberOfLines={1}>
              {banner.text}
            </Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Cancel" hitSlop={8} onPress={onCancelBanner}>
            <X size={18} color={CHAT.meta} />
          </Pressable>
        </View>
      ) : null}

      {images.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pending}>
          {images.map((img, i) => (
            <View key={img.id}>
              <Image source={{ uri: img.uri }} style={styles.pendingImg} contentFit="cover" />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove photo ${i + 1}`}
                hitSlop={6}
                onPress={() => onRemoveImage(img.id)}
                style={styles.pendingX}>
                <X size={12} weight="bold" color={colors.white} />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      ) : null}

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={editing ? 'Edit your message' : 'Message...'}
        placeholderTextColor={CHAT.meta}
        multiline
        maxLength={4000}
        accessibilityLabel="Message"
        style={styles.input}
      />

      <View style={styles.actions}>
        <View style={styles.side}>
          {editing ? null : (
            <>
              <RoundButton icon={menu ? X : Plus} label={menu ? 'Close' : 'More'} onPress={() => setMenu((m) => !m)} />
              {menu ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setMenu(false);
                    onTakePhoto();
                  }}
                  style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}>
                  <Camera size={16} color={colors.black} />
                  <Text style={styles.menuText}>Camera</Text>
                </Pressable>
              ) : (
                <RoundButton icon={ImageIcon} label="Add photos" onPress={onPickPhotos} />
              )}
            </>
          )}
        </View>
        <RoundButton icon={PaperPlaneTilt} label={editing ? 'Save' : 'Send'} primary disabled={!canSend} onPress={onSend} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
    paddingTop: 12,
    paddingBottom: 8,
    paddingHorizontal: 8,
    borderRadius: 24,
    backgroundColor: CHAT.surface,
    boxShadow: '0 2px 12px rgba(0,2,21,0.06)',
  },
  input: {
    maxHeight: 120,
    paddingHorizontal: 4,
    paddingVertical: 0,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 18,
    color: CHAT.theirsText,
  },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  side: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  round: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  roundPlain: { backgroundColor: CHAT.chip, borderWidth: 1.5, borderColor: CHAT.chipBorder },
  roundPrimary: { backgroundColor: colors.primary.default },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.7 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 19,
    backgroundColor: CHAT.chip,
    borderWidth: 1.5,
    borderColor: CHAT.chipBorder,
  },
  menuText: { fontFamily: fonts.medium, fontSize: 14, color: colors.black },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 4,
    paddingLeft: 10,
    paddingRight: 4,
    paddingVertical: 6,
    borderLeftWidth: 3,
    borderLeftColor: CHAT.mine,
    borderRadius: 4,
    backgroundColor: CHAT.chip,
  },
  bannerText: { flex: 1, minWidth: 0 },
  bannerTitle: { fontFamily: fonts.semibold, fontSize: 12, color: CHAT.mine },
  bannerBody: { fontFamily: fonts.regular, fontSize: 12, color: CHAT.meta },
  pending: { gap: 8, paddingHorizontal: 4 },
  pendingImg: { width: 64, height: 64, borderRadius: 12, backgroundColor: CHAT.chip },
  pendingX: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(21,22,34,0.6)',
  },
  typing: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 6 },
  typingText: { fontFamily: fonts.medium, fontSize: 12, color: CHAT.meta, marginRight: 2 },
});
