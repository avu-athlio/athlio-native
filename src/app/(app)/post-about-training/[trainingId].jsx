import { useLocalSearchParams, useRouter } from 'expo-router';
import { X } from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CaptionField } from '@/components/compose/MatchPostEditor';
import MediaPicker from '@/components/compose/MediaPicker';
import SuccessSheet from '@/components/compose/SuccessSheet';
import { finishCompose } from '@/components/compose/finish';
import { PageTopbar } from '@/components/navigation/Topbar';
import TrainingCard from '@/components/training/TrainingCard';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import { useUser } from '@/context/UserContext';
import { createPost } from '@/lib/posts';
import { fetchTraining, readTraining } from '@/lib/trainings';
import { colors, fonts } from '@/theme';

// Figma "Post about training" composer: training card, photos, caption.
export default function PostAboutTraining() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { trainingId: rawId } = useLocalSearchParams();
  const trainingId = Array.isArray(rawId) ? rawId[0] : rawId;
  const { user } = useUser();

  const [training, setTraining] = useState(null);
  const [error, setError] = useState(false);
  const [images, setImages] = useState([]);
  const [caption, setCaption] = useState('');
  const [sharing, setSharing] = useState(false);
  const [posted, setPosted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchTraining(trainingId).then(
      (row) => {
        if (cancelled) return;
        if (!row) setError(true);
        setTraining(readTraining(row));
      },
      () => !cancelled && setError(true),
    );
    return () => {
      cancelled = true;
    };
  }, [trainingId]);

  const share = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      await createPost({ uid: user.id, type: 'training', content: caption, images, trainingId });
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
        title="Post about training"
        showBack={false}
        right={<IconButton size="small" icon={X} onPress={() => router.back()} accessibilityLabel="Close" />}
      />
      {error ? (
        <Text style={styles.message}>Couldn&apos;t load this training.</Text>
      ) : !training ? (
        <ActivityIndicator style={styles.loading} color={colors.primary.default} />
      ) : (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <TrainingCard training={training} />
            <MediaPicker images={images} onChange={setImages} />
            <CaptionField value={caption} onChangeText={setCaption} />
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
  body: { padding: 16, gap: 16, paddingBottom: 32 },
  loading: { paddingVertical: 40 },
  message: { paddingVertical: 40, textAlign: 'center', fontFamily: fonts.regular, fontSize: 14, color: colors.neutral[500] },
  footer: { paddingHorizontal: 16, paddingTop: 12, backgroundColor: colors.neutral.bg },
});
