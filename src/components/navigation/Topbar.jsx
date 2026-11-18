import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { ArrowLeft, Bell, ChatCircle } from 'phosphor-react-native';
import { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import IconButton from '@/components/ui/IconButton';
import { useUser } from '@/context/UserContext';
import { fetchUnreadCount } from '@/lib/notifications';
import { colors, fonts } from '@/theme';

// Ports of the web Topbar variants. On web one component switched on the URL;
// here each screen renders the bar it needs.

const logo = require('@/assets/logos/main-logo.svg');

// Home: logo on the left, notifications + messages with badges on the right.
// The unread notification count refreshes whenever the screen comes into view
// (the web never loaded it, so its badge was always empty).
export function MainTopbar({ showBack = false, showActions = true }) {
  const router = useRouter();
  const { user, counts, setCounts } = useUser();
  const uid = user?.id;

  useFocusEffect(
    useCallback(() => {
      if (!showActions || !uid) return undefined;
      let cancelled = false;
      fetchUnreadCount(uid)
        .then((n) => !cancelled && setCounts((c) => (c.notifications === n ? c : { ...c, notifications: n })))
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }, [showActions, uid, setCounts]),
  );

  return (
    <TopbarFrame>
      <View style={styles.leftWithBack}>
        {showBack ? (
          <IconButton size="large" icon={ArrowLeft} onPress={() => router.back()} accessibilityLabel="Back" />
        ) : null}
        <Image source={logo} style={styles.logo} contentFit="contain" accessibilityLabel="Athlio" />
      </View>
      {showActions ? (
        <View style={styles.icons}>
          <BadgeIcon
            icon={Bell}
            label="Notifications"
            badge={counts.notifications > 0 ? `+${counts.notifications}` : null}
            onPress={() => router.push('/notifications')}
          />
          <BadgeIcon
            icon={ChatCircle}
            label="Messages"
            badge={counts.messages > 0 ? String(counts.messages) : null}
            onPress={() => router.push('/chat')}
          />
        </View>
      ) : null}
    </TopbarFrame>
  );
}

// Pushed screens: back arrow · uppercase title · optional right action.
export function PageTopbar({ title, backIcon = ArrowLeft, onBack, right = null, showBack = true }) {
  const router = useRouter();

  return (
    <TopbarFrame>
      <View style={styles.side}>
        {showBack ? (
          <IconButton
            size="small"
            icon={backIcon}
            onPress={onBack ?? (() => router.back())}
            accessibilityLabel="Back"
          />
        ) : null}
      </View>
      {title ? (
        <Text style={styles.pageTitle} numberOfLines={1} accessibilityRole="header">
          {title}
        </Text>
      ) : (
        <View style={styles.flex} />
      )}
      <View style={[styles.side, styles.sideRight]}>{right}</View>
    </TopbarFrame>
  );
}

// Profile pages: no background, white icons, floats over the profile header.
export function TransparentTopbar({ showBack = true, right = null }) {
  const router = useRouter();

  return (
    <TopbarFrame style={styles.transparent}>
      <View style={styles.side}>
        {showBack ? (
          <IconButton
            size="small"
            icon={ArrowLeft}
            color={colors.white}
            onPress={() => router.back()}
            accessibilityLabel="Back"
          />
        ) : null}
      </View>
      <View style={styles.transparentRight}>{right}</View>
    </TopbarFrame>
  );
}

// Height of the bar below the status bar, for content that sits under a TransparentTopbar.
export const TOPBAR_CONTENT_HEIGHT = 52;

function TopbarFrame({ children, style }) {
  const insets = useSafeAreaInsets();
  return <View style={[styles.bar, { paddingTop: insets.top + 8 }, style]}>{children}</View>;
}

function BadgeIcon({ icon: Icon, label, badge, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={badge ? `${label}, ${badge}` : label}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [styles.badgeIcon, pressed && styles.pressed]}>
      <Icon size={24} color={colors.black} />
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: colors.neutral.bg,
  },
  flex: { flex: 1 },
  leftWithBack: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo: { width: 61, height: 18 },
  icons: { flexDirection: 'row', gap: 4 },
  badgeIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 14,
    height: 14,
    paddingHorizontal: 2,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.default,
  },
  badgeText: { fontFamily: fonts.semibold, fontSize: 8, color: colors.white },
  side: { width: 36, height: 36, justifyContent: 'center' },
  sideRight: { alignItems: 'flex-end' },
  transparent: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, backgroundColor: 'transparent' },
  transparentRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pageTitle: {
    flex: 1,
    marginHorizontal: 8,
    fontFamily: fonts.condensedBoldItalic,
    fontSize: 24,
    lineHeight: 26,
    textTransform: 'uppercase',
    textAlign: 'center',
    color: colors.black,
  },
  pressed: { opacity: 0.6 },
});
