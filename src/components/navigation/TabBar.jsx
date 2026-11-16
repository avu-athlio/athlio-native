import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeIcon, PlusIcon, ScoutSearchIcon, SearchIcon, TargetIcon } from '@/components/icons/NavIcons';
import CreatePostMenu from '@/components/navigation/CreatePostMenu';
import { useUser } from '@/context/UserContext';
import { colors } from '@/theme';

// Port of the web Navbar: a floating pill with Home · Search · Create ·
// Progress/Scouting · Profile. Create isn't a route — it opens the post-type
// menu. Progress vs Scouting is decided in (tabs)/_layout via `href: null`;
// hidden routes never reach this component.

export const TAB_BAR_HEIGHT = 56;
const TAB_BAR_GAP = 12; // distance from the bottom edge when there's no home indicator
const MENU_GAP = 22; // space between the pill and the Create menu (web: 90px from the bottom)

// Space a tab screen should leave at the bottom so content isn't covered by the pill.
export function useTabBarSpace() {
  const insets = useSafeAreaInsets();
  return TAB_BAR_HEIGHT + Math.max(insets.bottom, TAB_BAR_GAP) + 8;
}

// Visual order. Routes arrive in Expo Router's order (see (tabs)/_layout).
const ORDER = ['home', 'search', 'progress', 'scouting', 'profile'];
const rank = (name) => {
  const i = ORDER.indexOf(name);
  return i === -1 ? ORDER.length : i;
};

const LABELS = {
  home: 'Home',
  search: 'Search',
  progress: 'Progress',
  scouting: 'Scout Tools',
  profile: 'Profile',
};

export default function TabBar({ state, descriptors, emitter, navigateToTab, insets }) {
  const { profile } = useUser();
  const [showPicker, setShowPicker] = useState(false);

  const focusedKey = state.routes[state.index]?.key;
  const barBottom = Math.max(insets.bottom, TAB_BAR_GAP);

  const press = (route) => {
    const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (route.key !== focusedKey && !event.defaultPrevented) navigateToTab(route.key);
  };

  const items = [];
  [...state.routes].sort((a, b) => rank(a.name) - rank(b.name)).forEach((route) => {
    if (!descriptors[route.key]) return;
    const focused = route.key === focusedKey && !showPicker;
    items.push(
      <TabItem
        key={route.key}
        name={route.name}
        focused={focused}
        avatarUrl={profile?.avatar_url}
        onPress={() => press(route)}
      />,
    );
    if (route.name === 'search') {
      items.push(
        <Pressable
          key="create"
          accessibilityRole="button"
          accessibilityLabel="Create post"
          accessibilityState={{ expanded: showPicker }}
          onPress={() => setShowPicker((p) => !p)}
          hitSlop={8}
          style={styles.item}>
          {showPicker ? <View style={styles.activeCircle} /> : null}
          <PlusIcon color={showPicker ? colors.primary.default : colors.neutral[700]} />
        </Pressable>,
      );
    }
  });

  return (
    <>
      <View
        pointerEvents="box-none"
        style={[styles.wrap, { bottom: barBottom }]}>
        <View style={styles.pill} accessibilityRole="tablist">
          {items}
        </View>
      </View>

      <CreatePostMenu
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        bottom={barBottom + TAB_BAR_HEIGHT + MENU_GAP}
      />
    </>
  );
}

function TabItem({ name, focused, avatarUrl, onPress }) {
  const color = focused ? colors.primary.default : colors.neutral[700];

  let icon;
  if (name === 'home') icon = <HomeIcon color={color} active={focused} />;
  else if (name === 'search') icon = <SearchIcon color={color} active={focused} />;
  else if (name === 'progress') icon = <TargetIcon color={color} />;
  else if (name === 'scouting') icon = <ScoutSearchIcon size={22} color={focused ? color : colors.black} active={focused} />;

  const isProfile = name === 'profile';

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={LABELS[name] ?? name}
      accessibilityState={{ selected: focused }}
      onPress={onPress}
      hitSlop={8}
      style={styles.item}>
      {isProfile ? (
        <View style={[styles.profileRing, focused && styles.profileRingActive]}>
          <View style={styles.avatar}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} contentFit="cover" contentPosition="top" />
            ) : null}
          </View>
        </View>
      ) : (
        <>
          {focused ? <View style={styles.activeCircle} /> : null}
          {icon}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pill: {
    width: 345,
    maxWidth: '92%',
    height: TAB_BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    borderRadius: 100,
    backgroundColor: 'rgba(251, 251, 251, 0.96)',
    boxShadow: '0 2px 24px rgba(21, 22, 34, 0.10)',
  },
  item: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeCircle: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.neutral[100],
  },
  profileRing: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileRingActive: { borderColor: colors.primary.default },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.neutral[200],
  },
  avatarImage: { width: 32, height: 40, marginTop: -1 },
});
