import { Image } from 'expo-image';
import { Check, MagnifyingGlass, UserCircle, X } from 'phosphor-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import StepHeader from '@/components/onboarding/StepHeader';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import { follow, isFollowing, unfollow } from '@/lib/follows';
import { supabase } from '@/lib/supabase';
import { colors, fonts } from '@/theme';
import { toPositionAbbr } from '@/utils/positions';

const FIELDS = 'id, full_name, username, avatar_url, primary_sport, club_id, country, position, role, org_name';

// Attach club names in one query instead of one per row.
async function withClubs(profiles) {
  const ids = [...new Set(profiles.map((p) => p.club_id).filter(Boolean))];
  if (ids.length === 0) return profiles;
  const { data } = await supabase.from('clubs').select('id, name').in('id', ids);
  const names = Object.fromEntries((data || []).map((c) => [c.id, c.name]));
  return profiles.map((p) => ({ ...p, clubName: names[p.club_id] }));
}

function PlayerRow({ profile, following, onToggle }) {
  const isAthlete = !profile.role || profile.role === 'athlete' || profile.role === 'player';
  const positions = Array.isArray(profile.position) ? profile.position : profile.position ? [profile.position] : [];
  const sub = isAthlete
    ? profile.clubName
    : [profile.org_name, profile.country].filter(Boolean).join(' · ');

  return (
    <View style={styles.row}>
      {profile.avatar_url ? (
        <Image source={{ uri: profile.avatar_url }} style={styles.avatar} contentFit="cover" />
      ) : (
        <View style={[styles.avatar, styles.avatarEmpty]}>
          <UserCircle size={32} weight="thin" color={colors.neutral[500]} />
        </View>
      )}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {profile.full_name || profile.username}
          </Text>
          {isAthlete ? (
            positions.slice(0, 2).map((p) => (
              <Text key={p} style={styles.badge}>
                {toPositionAbbr(p)}
              </Text>
            ))
          ) : (
            <Text style={styles.badge}>{profile.role}</Text>
          )}
        </View>
        {sub ? (
          <Text style={styles.sub} numberOfLines={1}>
            {sub}
          </Text>
        ) : null}
      </View>
      {following ? (
        <IconButton
          icon={Check}
          size="small"
          color={colors.primary.default}
          onPress={onToggle}
          accessibilityLabel={`Unfollow ${profile.full_name || profile.username}`}
        />
      ) : (
        <Button size="small" label="Follow" onPress={onToggle} />
      )}
    </View>
  );
}

export default function FindPeople({ userId, sport, position }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  // Search results plus the term they belong to, so "searching" is derived.
  const [found, setFound] = useState({ term: '', rows: [] });
  const [followingMap, setFollowingMap] = useState({});
  const known = useRef(new Set());

  async function loadFollowStatus(profiles) {
    const ids = profiles.map((p) => p.id).filter((id) => !known.current.has(id));
    if (ids.length === 0) return;
    ids.forEach((id) => known.current.add(id));
    const entries = await Promise.all(
      ids.map(async (id) => [id, await isFollowing(id).catch(() => false)]),
    );
    setFollowingMap((m) => ({ ...m, ...Object.fromEntries(entries) }));
  }

  // Suggestions: same sport + overlapping position, topped up with same sport,
  // falling back to anyone.
  useEffect(() => {
    if (!userId) return;
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const posArr = Array.isArray(position) ? position : position ? [position] : [];
        let data = [];
        if (posArr.length > 0 && sport) {
          const { data: byPos } = await supabase
            .from('profiles')
            .select(FIELDS)
            .neq('id', userId)
            .eq('primary_sport', sport)
            .overlaps('position', posArr)
            .limit(5);
          data = byPos || [];
        }
        if (data.length < 5 && sport) {
          const exclude = new Set([userId, ...data.map((p) => p.id)]);
          const { data: bySport } = await supabase
            .from('profiles')
            .select(FIELDS)
            .eq('primary_sport', sport)
            .limit(20);
          data = [...data, ...(bySport || []).filter((p) => !exclude.has(p.id)).slice(0, 5 - data.length)];
        }
        if (data.length === 0) {
          const { data: anyone } = await supabase.from('profiles').select(FIELDS).neq('id', userId).limit(5);
          data = anyone || [];
        }
        // Only show people who finished onboarding.
        data = await withClubs(data.filter((p) => p.full_name || p.username).slice(0, 5));
        if (!active) return;
        setSuggestions(data);
        loadFollowStatus(data);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [userId, sport, position]);

  const term = query.trim();
  useEffect(() => {
    if (!term || !userId) return;
    let active = true;
    const timer = setTimeout(async () => {
      let rows = [];
      try {
        const { data } = await supabase
          .from('profiles')
          .select(FIELDS)
          .neq('id', userId)
          .ilike('full_name', `%${term}%`)
          .limit(20);
        rows = await withClubs(data || []);
      } finally {
        if (active) {
          setFound({ term, rows });
          loadFollowStatus(rows);
        }
      }
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [term, userId]);

  async function toggle(id) {
    const was = !!followingMap[id];
    setFollowingMap((m) => ({ ...m, [id]: !was }));
    try {
      if (was) await unfollow(id);
      else await follow(id);
    } catch {
      setFollowingMap((m) => ({ ...m, [id]: was }));
    }
  }

  const isSearching = term.length > 0;
  const list = isSearching ? (found.term === term ? found.rows : []) : suggestions;
  const busy = isSearching ? found.term !== term : loading;

  return (
    <View>
      <StepHeader title="Find people" subtitle="Connect with players, coaches and scouts you might know" />

      <View style={styles.search}>
        <MagnifyingGlass size={18} color={colors.neutral[700]} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name..."
          placeholderTextColor={colors.neutral[700]}
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Search by name"
          style={styles.searchInput}
        />
        {query ? (
          <Pressable hitSlop={8} onPress={() => setQuery('')} accessibilityLabel="Clear search">
            <X size={16} weight="bold" color={colors.neutral[700]} />
          </Pressable>
        ) : null}
      </View>

      {!isSearching ? <Text style={styles.section}>Suggested for you</Text> : null}

      {busy ? (
        <ActivityIndicator color={colors.primary.default} style={styles.loader} />
      ) : list.length === 0 ? (
        <Text style={styles.status}>{isSearching ? 'No results found.' : 'No suggestions yet.'}</Text>
      ) : (
        <View style={styles.list}>
          {list.map((p) => (
            <PlayerRow key={p.id} profile={p} following={!!followingMap[p.id]} onToggle={() => toggle(p.id)} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  search: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: colors.neutral[100],
    marginBottom: 20,
  },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 16, color: colors.black },
  section: { fontFamily: fonts.semibold, fontSize: 16, color: colors.black, marginBottom: 12 },
  loader: { marginVertical: 24 },
  status: { fontFamily: fonts.regular, fontSize: 14, color: colors.neutral[700], paddingVertical: 8 },
  list: { gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarEmpty: { backgroundColor: colors.neutral[200], alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { flexShrink: 1, fontFamily: fonts.semibold, fontSize: 16, color: colors.black },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: colors.neutral[100],
    fontFamily: fonts.semibold,
    fontSize: 11,
    textTransform: 'uppercase',
    color: colors.neutral[800],
  },
  sub: { fontFamily: fonts.regular, fontSize: 14, color: colors.neutral[700] },
});
