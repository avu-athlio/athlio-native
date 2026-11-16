import { useRouter } from 'expo-router';
import { PlusCircle, Sneaker, SoccerBall } from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Modal, Pressable, StyleSheet, Text } from 'react-native';

import { useUser } from '@/context/UserContext';
import { colors, fonts } from '@/theme';

// Port of the web AddPostModal + PostTypePicker: a small white card that floats
// just above the tab bar (no dimmed backdrop). Tapping outside closes it.
// Professionals don't see "Match"; "Training" isn't built yet.
const TYPES = [
  { key: 'post', title: 'Post', icon: PlusCircle, disabled: false },
  { key: 'match', title: 'Match', icon: SoccerBall, disabled: false },
  { key: 'training', title: 'Training', icon: Sneaker, disabled: true },
];

const IN_MS = 180;
const OUT_MS = 150;

// `bottom` = distance from the screen's bottom edge to the bottom of the card.
export default function CreatePostMenu({ visible, onClose, bottom }) {
  const router = useRouter();
  const { isScout, canPost } = useUser();

  // Keep the Modal mounted while the close animation plays.
  const [mounted, setMounted] = useState(visible);
  const [progress] = useState(() => new Animated.Value(0));
  if (visible && !mounted) setMounted(true);

  useEffect(() => {
    let cancelled = false;

    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled) return;
      Animated.timing(progress, {
        toValue: visible ? 1 : 0,
        duration: reduce ? 0 : visible ? IN_MS : OUT_MS,
        easing: visible ? Easing.out(Easing.quad) : Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && !visible && !cancelled) setMounted(false);
      });
    });

    return () => {
      cancelled = true;
    };
  }, [visible, progress]);

  const visibleTypes = isScout ? TYPES.filter((t) => t.key !== 'match') : TYPES;

  const choose = (key) => {
    onClose();
    if (key === 'match') router.push('/add-match');
    else router.push({ pathname: '/add-post', params: { type: key } });
  };

  const cardMotion = {
    opacity: progress,
    transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
  };

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close menu" />
      <Animated.View
        style={[styles.card, { bottom }, cardMotion]}
        accessibilityViewIsModal
        accessibilityLabel="Create">
        {visibleTypes.map((t) => (
          <PostTypeButton
            key={t.key}
            title={t.title}
            icon={t.icon}
            disabled={t.disabled || !canPost(t.key)}
            onPress={() => choose(t.key)}
          />
        ))}
      </Animated.View>
    </Modal>
  );
}

function PostTypeButton({ title, icon: Icon, onPress, disabled }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, disabled && styles.disabled, pressed && styles.pressed]}>
      <Icon size={28} weight="light" color={colors.black} />
      <Text style={styles.label}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    alignSelf: 'center',
    width: 148,
    padding: 12,
    gap: 2,
    borderRadius: 16,
    backgroundColor: colors.white,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 6,
  },
  label: {
    fontFamily: fonts.condensedSemiboldItalic,
    fontSize: 20,
    lineHeight: 22,
    textTransform: 'uppercase',
    color: colors.black,
  },
  disabled: { opacity: 0.35 },
  pressed: { opacity: 0.6 },
});
