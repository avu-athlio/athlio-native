import { useLocalSearchParams, useRouter } from 'expo-router';
import { X } from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import MatchPostEditor from '@/components/compose/MatchPostEditor';
import SuccessSheet from '@/components/compose/SuccessSheet';
import { cardFromMatch, finishCompose } from '@/components/compose/finish';
import { PageTopbar } from '@/components/navigation/Topbar';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import { useUser } from '@/context/UserContext';
import { formatMatchDate } from '@/lib/format';
import { createPost, fetchClub, fetchMatch } from '@/lib/posts';
import { colors, fonts } from '@/theme';

// Port of pages/PostAboutMatchComposer. The web's "Add link to the match"
// field is gone: it was never saved (posts has no link column).
export default function PostAboutMatch() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { matchId: rawId } = useLocalSearchParams();
  const matchId = Array.isArray(rawId) ? rawId[0] : rawId;
  const { user, profile } = useUser();

  const [match, setMatch] = useState(null);
  const [club, setClub] = useState(null);
  const [error, setError] = useState(false);
  const [images, setImages] = useState([]);
  const [caption, setCaption] = useState('');
  const [sharing, setSharing] = useState(false);
  const [posted, setPosted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchMatch(matchId), profile?.club_id ? fetchClub(profile.club_id) : null]).then(
      ([m, c]) => {
        if (cancelled) return;
        if (!m) setError(true);
        setMatch(m);
        setClub(c);
      },
      () => !cancelled && setError(true),
    );
    return () => {
      cancelled = true;
    };
  }, [matchId, profile?.club_id]);

  const share = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      await createPost({ uid: user.id, type: 'match', content: caption, images, matchId });
      setPosted(true);
    } catch (e) {
      Alert.alert('Could not share your post', e?.message ?? 'Try again.');
    } finally {
      setSharing(false);
    }
  };

  return (
    <View style={styles.screen}>
      <PageTopbar
        title="Post about match"
        showBack={false}
        right={<IconButton size="small" icon={X} onPress={() => router.back()} accessibilityLabel="Close" />}
      />
      {error ? (
        <Text style={styles.message}>Couldn&apos;t load this match.</Text>
      ) : !match ? (
        <ActivityIndicator style={styles.loading} color={colors.primary.default} />
      ) : (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <MatchPostEditor
              card={{ ...cardFromMatch(match, club), date: formatMatchDate(match.date_of_game) }}
              images={images}
              onImagesChange={setImages}
              caption={caption}
              onCaptionChange={setCaption}
            />
          </ScrollView>
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <Button label={sharing ? 'Sharing…' : 'Share'} type="primary" size="big" disabled={sharing} onPress={share} />
          </View>
        </KeyboardAvoidingView>
      )}

      <SuccessSheet
        visible={posted}
        title="Post is created"
        subtitle="Now your friends can see your results and get inspired"
        onClose={() => finishCompose(router)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.neutral.bg },
  flex: { flex: 1 },
  body: { padding: 16, paddingBottom: 32 },
  loading: { paddingVertical: 40 },
  message: { paddingVertical: 40, textAlign: 'center', fontFamily: fonts.regular, fontSize: 14, color: colors.neutral[500] },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: colors.neutral.bg,
  },
});
