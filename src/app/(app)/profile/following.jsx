import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PageTopbar } from '@/components/navigation/Topbar';
import Button from '@/components/ui/Button';
import PlayerCard from '@/components/ui/PlayerCard';
import SearchBar from '@/components/ui/SearchBar';
import { useUser } from '@/context/UserContext';
import { follow, unfollow } from '@/lib/follows';
import { fetchFollowingProfiles } from '@/lib/profile';
import { colors, fonts } from '@/theme';

// Port of pages/ProfileFollowing. The web removed a row as soon as you
// unfollowed; here the row stays and flips to "Follow", so a mis-tap can be undone.
export default function Following() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const userId = user?.id;

  const [people, setPeople] = useState([]);
  const [unfollowed, setUnfollowed] = useState(() => new Set());
  const [status, setStatus] = useState('loading');
  const [query, setQuery] = useState('');
  const pendingRef = useRef(new Set());

  const load = useCallback(
    () =>
      fetchFollowingProfiles(userId).then(
        (rows) => {
          setPeople(rows);
          setStatus('ready');
        },
        (e) => {
          console.warn('following', e?.message);
          setStatus('error');
        },
      ),
    [userId],
  );

  useEffect(() => {
    if (userId) load();
  }, [userId, load]);

  // `wasFollowing` = what the row shows right now.
  const toggle = useCallback(async (id, wasFollowing) => {
    if (pendingRef.current.has(id)) return;
    pendingRef.current.add(id);
    const mark = (isUnfollowed) =>
      setUnfollowed((prev) => {
        const next = new Set(prev);
        if (isUnfollowed) next.add(id);
        else next.delete(id);
        return next;
      });
    mark(wasFollowing);
    try {
      if (wasFollowing) await unfollow(id);
      else await follow(id);
    } catch (e) {
      console.warn('toggle follow', e?.message);
      mark(!wasFollowing);
    } finally {
      pendingRef.current.delete(id);
    }
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return people;
    return people.filter((p) => (p.full_name || p.username || '').toLowerCase().includes(q));
  }, [people, query]);

  return (
    <View style={styles.screen}>
      <PageTopbar title="Following" />
      <View style={styles.search}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search following…" />
      </View>

      {status === 'loading' ? (
        <ActivityIndicator style={styles.loading} color={colors.primary.default} />
      ) : status === 'error' ? (
        <View style={styles.center}>
          <Text style={styles.empty}>Couldn&apos;t load following.</Text>
          <Button
            type="secondary"
            size="small"
            label="Try again"
            onPress={() => {
              setStatus('loading');
              load();
            }}
          />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(p) => p.id}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
          renderItem={({ item }) => {
            const isFollowing = !unfollowed.has(item.id);
            return (
            <PlayerCard
              profile={item}
              isFollowing={isFollowing}
              onFollow={() => toggle(item.id, isFollowing)}
              onPress={() => router.push({ pathname: '/profile/[id]', params: { id: item.id } })}
            />
            );
          }}
          ListEmptyComponent={
            <Text style={styles.empty}>{query ? 'No results.' : "You're not following anyone yet."}</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.neutral.bg },
  search: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  list: { gap: 8, paddingTop: 8 },
  loading: { paddingVertical: 40 },
  center: { alignItems: 'center', gap: 16, paddingVertical: 40 },
  empty: {
    paddingVertical: 40,
    paddingHorizontal: 16,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.neutral[500],
  },
});
