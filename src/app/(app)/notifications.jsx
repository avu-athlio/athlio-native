import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PageTopbar } from '@/components/navigation/Topbar';
import NotificationRow from '@/components/notifications/NotificationRow';
import Button from '@/components/ui/Button';
import PlayerCard from '@/components/ui/PlayerCard';
import { useUser } from '@/context/UserContext';
import { fetchFollowingIds } from '@/lib/feed';
import { follow, unfollow } from '@/lib/follows';
import { fetchNotifications, groupNotifications, markAllRead } from '@/lib/notifications';
import { fetchSuggestions } from '@/lib/search';
import { colors, fonts } from '@/theme';

/**
 * Figma "Notifications" (port of the web NotificationBlock). Grouped into
 * Today / Yesterday / Last week / Earlier; likes on one post are merged.
 * Opening the screen marks everything read (rows that were new keep their
 * blue look until you leave) and clears the bell badge.
 */
export default function Notifications() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile, setCounts } = useUser();
  const uid = user?.id;

  const [rows, setRows] = useState(null);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [following, setFollowing] = useState(() => new Set()); // ids I follow

  // Mark everything read once the list is on screen, and clear the bell badge.
  const markSeen = useCallback(async () => {
    await markAllRead(uid);
    setCounts((c) => ({ ...c, notifications: 0 }));
  }, [uid, setCounts]);

  // Pull to refresh / Try again.
  const load = useCallback(async () => {
    try {
      setRows(await fetchNotifications(uid));
      setError(false);
      await markSeen();
    } catch {
      setError(true);
    }
  }, [uid, markSeen]);

  useEffect(() => {
    if (!uid) return undefined;
    let cancelled = false;
    fetchNotifications(uid).then(
      (r) => {
        if (cancelled) return;
        setRows(r);
        markSeen();
      },
      () => !cancelled && setError(true),
    );
    return () => {
      cancelled = true;
    };
  }, [uid, markSeen]);

  // Who I already follow, for "Follow back" on new-follower rows.
  useEffect(() => {
    if (!uid) return undefined;
    let cancelled = false;
    fetchFollowingIds(uid)
      .then((ids) => !cancelled && setFollowing(new Set(ids)))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [uid]);

  useEffect(() => {
    if (!uid) return undefined;
    let cancelled = false;
    fetchSuggestions({ kind: 'athletes', uid, country: profile?.country, limit: 3 })
      .then((s) => !cancelled && setSuggestions(s))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [uid, profile?.country]);

  const sections = useMemo(() => (rows ? groupNotifications(rows) : []), [rows]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const openItem = (item) => {
    if (item.kind === 'follow') return openProfile(item.actors[0].id);
    if (!item.postId) return;
    router.push({
      pathname: '/post/[id]',
      params: item.kind === 'like' ? { id: item.postId } : { id: item.postId, comments: '1' },
    });
  };

  const openProfile = (id) => router.push({ pathname: '/profile/[id]', params: { id } });

  const toggleFollow = async (id) => {
    const was = following.has(id);
    const flip = (on) =>
      setFollowing((s) => {
        const next = new Set(s);
        if (on) next.add(id);
        else next.delete(id);
        return next;
      });
    flip(!was);
    try {
      if (was) await unfollow(id);
      else await follow(id);
    } catch {
      flip(was);
    }
  };

  // One new follower → "Follow back" / "Following" on the right of the row.
  const followBack = (item) => {
    if (item.kind !== 'follow' || item.actors.length !== 1) return null;
    const id = item.actors[0].id;
    const on = following.has(id);
    return (
      <Button
        size="xsmall"
        type={on ? 'following' : 'primary'}
        label={on ? 'Following' : 'Follow back'}
        onPress={() => toggleFollow(id)}
      />
    );
  };

  return (
    <View style={styles.screen}>
      <PageTopbar title="Notifications" />
      {error && !rows ? (
        <View style={styles.center}>
          <Text style={styles.message}>Couldn&apos;t load your notifications.</Text>
          <Button type="secondary" size="small" label="Try again" onPress={load} />
        </View>
      ) : !rows ? (
        <ActivityIndicator style={styles.loading} color={colors.primary.default} />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.body, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary.default} />}>
          {sections.length ? (
            sections.map((s) => (
              <View key={s.title} style={styles.section}>
                <Text style={styles.title} accessibilityRole="header">
                  {s.title}
                </Text>
                <View style={styles.list}>
                  {s.items.map((item) => (
                    <NotificationRow
                      key={item.key}
                      item={item}
                      onPress={() => openItem(item)}
                      action={followBack(item)}
                    />
                  ))}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.message}>When people follow you, give your posts aura or comment on them, you&apos;ll see it here.</Text>
            </View>
          )}

          {suggestions.length ? (
            <View style={styles.section}>
              <Text style={styles.title} accessibilityRole="header">
                Follow suggestions
              </Text>
              <View style={styles.list}>
                {suggestions.map((p) => (
                  <PlayerCard
                    key={p.id}
                    profile={p}
                    detail="league"
                    isFollowing={following.has(p.id)}
                    onFollow={() => toggleFollow(p.id)}
                    onPress={() => openProfile(p.id)}
                  />
                ))}
              </View>
            </View>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.neutral.bg },
  body: { paddingHorizontal: 16, paddingTop: 16, gap: 24 },
  section: { gap: 12 },
  title: { fontFamily: fonts.semibold, fontSize: 16, color: colors.black },
  list: { gap: 8 },
  loading: { paddingVertical: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  empty: { alignItems: 'center', gap: 6, paddingVertical: 32 },
  emptyTitle: { fontFamily: fonts.semibold, fontSize: 16, color: colors.black },
  message: { fontFamily: fonts.regular, fontSize: 14, color: colors.neutral[600], textAlign: 'center' },
});
