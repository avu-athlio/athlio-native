import { useRouter } from 'expo-router';
import { Plus, X } from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PageTopbar } from '@/components/navigation/Topbar';
import TrainingCard from '@/components/training/TrainingCard';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import { useUser } from '@/context/UserContext';
import { fetchMyTrainings, readTraining } from '@/lib/trainings';
import { colors, fonts } from '@/theme';

// Figma "Post about training": pick one of my logged trainings (2-column grid).
// None yet → straight to Add training, like Post about match does.
export default function PostAboutTrainingSelect() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const [trainings, setTrainings] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchMyTrainings(user.id).then(
      (rows) => {
        if (cancelled) return;
        if (!rows.length) router.replace('/add-training');
        else setTrainings(rows.map(readTraining));
      },
      () => !cancelled && setError(true),
    );
    return () => {
      cancelled = true;
    };
  }, [user.id, router]);

  return (
    <View style={styles.screen}>
      <PageTopbar
        title="Post about training"
        showBack={false}
        right={<IconButton size="small" icon={X} onPress={() => router.back()} accessibilityLabel="Close" />}
      />
      {error ? (
        <Text style={styles.message}>Couldn&apos;t load your trainings.</Text>
      ) : !trainings ? (
        <ActivityIndicator style={styles.loading} color={colors.primary.default} />
      ) : (
        <FlatList
          data={trainings}
          keyExtractor={(t) => t.id}
          numColumns={2}
          columnWrapperStyle={styles.columns}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${item.label} training, ${item.duration} minutes`}
              onPress={() => router.push({ pathname: '/post-about-training/[trainingId]', params: { trainingId: item.id } })}
              style={({ pressed }) => [styles.cell, pressed && styles.pressed]}>
              <TrainingCard training={item} compact />
            </Pressable>
          )}
        />
      )}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button label="Add new training" type="primary" size="big" leadingIcon={Plus} onPress={() => router.push('/add-training')} />
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
  message: { paddingVertical: 40, textAlign: 'center', fontFamily: fonts.regular, fontSize: 14, color: colors.neutral[500] },
  footer: { paddingHorizontal: 16, paddingTop: 16, backgroundColor: colors.neutral.bg },
});
