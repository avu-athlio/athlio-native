import { X } from 'phosphor-react-native';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts } from '@/theme';

/**
 * Slide-up sheet over a dimmed backdrop. Tapping the backdrop or ✕ closes it.
 * variant — "default" (grey, title + ✕)
 *         | "popover" (Figma popover: white — or `grey` — bordered header with ✕, padded body, bordered `footer`)
 *         | "handle"  (Figma dropdown: white, grab handle, left title, no ✕; `footer` under the body)
 */
export default function BottomSheet({ visible, onClose, title, children, footer = null, variant = 'default', grey = false }) {
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 16);

  let sheet;
  if (variant === 'popover') {
    sheet = (
      <View style={[styles.popover, grey && styles.grey, !footer && { paddingBottom: bottom }]}>
        <View style={styles.popoverHeader}>
          <Text style={styles.popoverTitle} accessibilityRole="header">
            {title}
          </Text>
          <CloseButton onPress={onClose} />
        </View>
        <View style={styles.popoverBody}>{children}</View>
        {footer ? <View style={[styles.popoverFooter, { paddingBottom: bottom }]}>{footer}</View> : null}
      </View>
    );
  } else if (variant === 'handle') {
    sheet = (
      <View style={[styles.handleSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.handle} />
        {title ? (
          <Text style={styles.handleTitle} accessibilityRole="header">
            {title}
          </Text>
        ) : null}
        {children}
        {footer}
      </View>
    );
  } else {
    sheet = (
      <View style={[styles.sheet, { paddingBottom: bottom }]}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <CloseButton onPress={onClose} />
        </View>
        {children}
      </View>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
        {sheet}
      </KeyboardAvoidingView>
    </Modal>
  );
}

function CloseButton({ onPress }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} accessibilityRole="button" accessibilityLabel="Close">
      <X size={24} color={colors.black} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(21,22,34,0.45)' },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: colors.neutral.bg,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    minHeight: 56,
  },
  title: { fontFamily: fonts.semibold, fontSize: 18, color: colors.black },

  popover: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  grey: { backgroundColor: colors.neutral.bg },
  popoverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  popoverTitle: { fontFamily: fonts.semibold, fontSize: 18, lineHeight: 24, letterSpacing: -0.18, color: colors.black },
  popoverBody: { padding: 16 },
  popoverFooter: {
    paddingTop: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },

  handleSheet: {
    gap: 16,
    paddingTop: 8,
    paddingHorizontal: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.white,
  },
  handle: { alignSelf: 'center', width: 64, height: 4, borderRadius: 999, backgroundColor: colors.neutral[200] },
  handleTitle: { fontFamily: fonts.semibold, fontSize: 18, color: colors.black },
});
