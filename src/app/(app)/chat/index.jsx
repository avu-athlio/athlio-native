import { useFocusEffect, useRouter } from 'expo-router';
import { ArrowLeft, BellSlash } from 'phosphor-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { firstName, timeAgo } from '@/components/chat/chatShared';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import PillTabs from '@/components/ui/PillTabs';
import SearchBar from '@/components/ui/SearchBar';
import { useUser } from '@/context/UserContext';
import { chatMissing, fetchInbox, subscribeToInbox } from '@/lib/chat';
import { colors, fonts } from '@/theme';

const TABS = [
  { id: 'recent', label: 'Recent' },
  { id: 'unread', label: 'Unread' },
];

function preview(c) {
  const who = c.lastMine ? 'You' : firstName(c.other);
  const what = c.lastDeleted ? 'Message deleted' : c.lastBody || (c.lastHasImages ? 'Sent a photo' : '');
  return `${who}: ${what}`;
}

/** Figma "Messages": search, Recent / Unread, one row per conversation. */
export default function Inbox() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, setCounts } = useUser();
  const uid = user?.id;

  const [tab, setTab] = useState('recent');
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | missing | error
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!uid) return;
    try {
      const r = await fetchInbox(uid);
      setRows(r);
      setStatus('ready');
      setCounts((c) => ({ ...c, messages: r.filter((x) => !x.muted).reduce((n, x) => n + x.unread, 0) }));
    } catch (e) {
      setStatus(chatMissing(e) ? 'missing' : 'error');
    }
  }, [uid, setCounts]);

  // Reload whenever the inbox comes back into view (e.g. after reading a chat)…
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );
  // …and when a new message arrives while it's open.
  useEffect(() => subscribeToInbox(() => load()), [load]);

  const shown = useMemo(() => {
    let list = rows ?? [];
    if (tab === 'unread') list = list.filter((c) => c.unread > 0);
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((c) =>
        [c.other.full_name, c.other.username, c.lastBody].some((s) => s?.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [rows, tab, query]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.searchRow}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back" hitSlop={8} onPress={() => router.back()}>
            <ArrowLeft size={28} color={colors.black} />
          </Pressable>
          <View style={styles.flex}>
            <SearchBar value={query} onChangeText={setQuery} placeholder="Search for message" />
          </View>
        </View>
        <PillTabs tabs={TABS} activeTab={tab} onTabChange={setTab} style={styles.tabs} />
      </View>

      {status === 'loading' ? (
        <ActivityIndicator style={styles.loading} color={colors.primary.default} />
      ) : status === 'missing' ? (
        <Text style={styles.message}>Chat isn&apos;t set up on the server yet.</Text>
      ) : status === 'error' && !rows ? (
        <Text style={styles.message}>Couldn&apos;t load your messages. Pull to try again.</Text>
      ) : (
        <FlatList
          data={shown}
          keyExtractor={(c) => c.id}
          contentContainerStyle={[styles.list, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary.default} />}
          keyboardDismissMode="on-drag"
          renderItem={({ item }) => (
            <ConversationRow item={item} onPress={() => router.push({ pathname: '/chat/[id]', params: { id: item.id } })} />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>
                {query.trim() ? 'No matches' : tab === 'unread' ? 'You’re all caught up' : 'No messages yet'}
              </Text>
              {!query.trim() && tab === 'recent' ? (
                <Text style={styles.message}>Open someone&apos;s profile and tap Message to start a chat.</Text>
              ) : null}
            </View>
          }
        />
      )}
    </View>
  );
}

function ConversationRow({ item, onPress }) {
  const p = item.other;
  const name = p.full_name || p.username || 'Athlio user';
  const unread = item.unread > 0;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${name}${unread ? `, ${item.unread} unread` : ''}. ${preview(item)}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.left}>
        {unread ? <View style={styles.dot} /> : <View style={styles.dotSpace} />}
        <Avatar uri={p.avatar_url} size="medium" verified={p.verified} />
        <View style={styles.texts}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            {p.role ? <Badge text={p.role === 'athlete' ? 'Player' : p.role} /> : null}
          </View>
          <Text style={styles.preview} numberOfLines={1}>
            {preview(item)}
          </Text>
        </View>
      </View>
      <View style={styles.right}>
        <Text style={[styles.time, unread && styles.timeUnread]}>{timeAgo(item.lastAt)}</Text>
        {item.muted ? <BellSlash size={12} color={colors.neutral[600]} accessibilityLabel="Muted" /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.neutral.bg },
  flex: { flex: 1 },
  header: { backgroundColor: colors.white, paddingBottom: 12, gap: 12 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16 },
  tabs: { paddingVertical: 0 },
  list: { padding: 15, gap: 7, flexGrow: 1 },
  loading: { paddingVertical: 40 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 12,
    paddingLeft: 8,
    paddingRight: 12,
    borderRadius: 8,
    backgroundColor: colors.white,
  },
  pressed: { opacity: 0.75 },
  left: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary.default },
  dotSpace: { width: 8 },
  texts: { flex: 1, minWidth: 0, gap: 2, paddingTop: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { flexShrink: 1, fontFamily: fonts.semibold, fontSize: 16, color: colors.black },
  preview: { fontFamily: fonts.medium, fontSize: 14, color: colors.neutral[600] },
  right: { alignItems: 'flex-end', gap: 4 },
  time: { fontFamily: fonts.medium, fontSize: 10, color: colors.neutral[600] },
  timeUnread: { color: colors.primary[500] },
  empty: { alignItems: 'center', gap: 6, paddingVertical: 40, paddingHorizontal: 24 },
  emptyTitle: { fontFamily: fonts.semibold, fontSize: 16, color: colors.black },
  message: { paddingVertical: 8, textAlign: 'center', fontFamily: fonts.regular, fontSize: 14, color: colors.neutral[600] },
});
