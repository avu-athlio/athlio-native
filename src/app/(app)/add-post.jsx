import { useRouter } from 'expo-router';
import { X } from 'phosphor-react-native';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CaptionField } from '@/components/compose/MatchPostEditor';
import MediaPicker from '@/components/compose/MediaPicker';
import SuccessSheet from '@/components/compose/SuccessSheet';
import { finishCompose } from '@/components/compose/finish';
import { PageTopbar } from '@/components/navigation/Topbar';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import { useUser } from '@/context/UserContext';
import { createPost } from '@/lib/posts';
import { colors } from '@/theme';

// Figma "Create new post": photos + caption. (Match posts start from the
// Create menu → Post about match, so the web's "Attach" row is gone.)
export default function AddPost() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useUser();

  const [images, setImages] = useState([]);
  const [text, setText] = useState('');
  const [sharing, setSharing] = useState(false);
  const [posted, setPosted] = useState(false);

  const dirty = text.trim().length > 0 || images.length > 0;
  const canShare = dirty && !sharing;

  const close = () => {
    if (!dirty) return router.back();
    Alert.alert('Discard post?', 'Your photos and text will be lost.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => router.back() },
    ]);
  };

  const share = async () => {
    if (!canShare) return;
    setSharing(true);
    try {
      await createPost({ uid: user.id, type: 'basic', content: text, images });
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
        title="Create new post"
        showBack={false}
        right={<IconButton size="small" icon={X} onPress={close} accessibilityLabel="Close" />}
      />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <MediaPicker images={images} onChange={setImages} />
          <CaptionField value={text} onChangeText={setText} />
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Button
            label={sharing ? 'Sharing…' : 'Share'}
            type="primary"
            size="big"
            disabled={!canShare}
            onPress={share}
          />
        </View>
      </KeyboardAvoidingView>

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
  body: { padding: 16, gap: 16, paddingBottom: 24 },
  footer: { paddingHorizontal: 16, paddingTop: 16, backgroundColor: colors.neutral.bg },
});
