import { useRouter } from 'expo-router';
import { Plus, X } from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cardFromMatch } from '@/components/compose/finish';
import { PageTopbar } from '@/components/navigation/Topbar';
import MatchCard from '@/components/post/MatchCard';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import { useUser } from '@/context/UserContext';
import { formatMatchDate } from '@/lib/format';
import { fetchClub, fetchMyMatches } from '@/lib/posts';
import { colors, fonts } from '@/theme';

// Port of pages/PostAboutMatch: pick one of my matches (2-column grid of
// compact cards). No matches yet → straight to Add match, as on the web.
export default function PostAboutMatchSelect() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile } = useUser();
  const [matches, setMatches] = useState(null);
  const [club, setClub] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchMyMatches(user.id), profile?.club_id ? fetchClub(profile.club_id) : null]).then(
      ([rows, c]) => {
        if (cancelled) return;
        if (!rows.length) router.replace('/add-match');
        else {
          setMatches(rows);
          setClub(c);
        }
      },
      () => !cancelled && setError(true),
    );
    return () => {
      cancelled = true;
    };
  }, [user.id, profile?.club_id, router]);

  return (
    <View style={styles.screen}>
      <PageTopbar
        title="Post about match"
        showBack={false}
        right={<IconButton size="small" icon={X} onPress={() => router.back()} accessibilityLabel="Close" />}
      />
      {error ? (
        <Text style={styles.message}>Couldn&apos;t load your matches.</Text>
      ) : !matches ? (
        <ActivityIndicator style={styles.loading} color={colors.primary.default} />
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(m) => m.id}
          numColumns={2}
          columnWrapperStyle={styles.columns}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${item.your_team || 'Your team'} ${item.your_score}–${item.opponent_score} ${item.opponent || ''}`}
              onPress={() => router.push({ pathname: '/post-about-match/[matchId]', params: { matchId: item.id } })}
              style={({ pressed }) => [styles.cell, pressed && styles.pressed]}>
              <MatchCard compact {...cardFromMatch(item, club)} date={formatMatchDate(item.date_of_game)} />
            </Pressable>
          )}
        />
      )}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button label="Add new match" type="primary" size="big" leadingIcon={Plus} onPress={() => router.push('/add-match')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.neutral.bg },
  grid: { padding: 16, gap: 12 },
  columns: { gap: 12 },
  cell: { flex: 1, maxWidth: '50%' },
  pressed: { opacity: 0.7 },
  loading: { paddingVertical: 40 },
  message: {
    paddingVertical: 40,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.neutral[500],
  },
  footer: { paddingHorizontal: 16, paddingTop: 16, backgroundColor: colors.neutral.bg },
});
