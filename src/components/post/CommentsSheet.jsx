import { ArrowUp } from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';

import CommentCard from '@/components/post/CommentCard';
import BottomSheet from '@/components/ui/BottomSheet';
import IconButton from '@/components/ui/IconButton';
import { useUser } from '@/context/UserContext';
import { addComment, fetchComments } from '@/lib/feed';
import { colors, fonts } from '@/theme';

// Port of the web CommentsOverlay as a bottom sheet (moves up with the keyboard).
// One instance per feed; `target` = { postId, authorId } or null when closed.
export default function CommentsSheet({ target, onClose, onCommentAdded, onOpenProfile }) {
  const { user } = useUser();
  const { height } = useWindowDimensions();
  const postId = target?.postId ?? null;

  // Comments are keyed by post so switching posts never shows the old list.
  const [loaded, setLoaded] = useState({ postId: null, comments: [], error: null });
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (!postId) return;
    let cancelled = false;
    fetchComments(postId)
      .then((comments) => !cancelled && setLoaded({ postId, comments, error: null }))
      .catch((e) => !cancelled && setLoaded({ postId, comments: [], error: e?.message ?? 'Could not load comments.' }));
    return () => {
      cancelled = true;
    };
  }, [postId]);

  const loading = !!postId && loaded.postId !== postId;
  const comments = loading ? [] : loaded.comments;
  const error = submitError || (loading ? null : loaded.error);

  const close = () => {
    setText('');
    setSubmitError(null);
    onClose();
  };

  async function submit() {
    const content = text.trim();
    if (!content || !user?.id || !postId || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const comment = await addComment({ postId, postAuthorId: target.authorId, userId: user.id, content });
      setLoaded((prev) => (prev.postId === postId ? { ...prev, comments: [...prev.comments, comment] } : prev));
      setText('');
      onCommentAdded?.(postId);
    } catch (e) {
      setSubmitError(e?.message ?? 'Could not post your comment.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <BottomSheet visible={!!target} onClose={close} title="Comments">
      <View style={[styles.body, { height: Math.round(height * 0.6) }]}>
        {loading ? (
          <ActivityIndicator style={styles.loader} color={colors.primary.default} />
        ) : (
          <FlatList
            data={comments}
            keyExtractor={(c) => String(c.id)}
            renderItem={({ item }) => (
              <CommentCard
                comment={item}
                onOpenProfile={(id) => {
                  close();
                  onOpenProfile(id);
                }}
              />
            )}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={!error ? <Text style={styles.empty}>Be the first to comment.</Text> : null}
            ListHeaderComponent={error ? <Text style={styles.error}>{error}</Text> : null}
          />
        )}

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Add a comment…"
            placeholderTextColor={colors.neutral[700]}
            value={text}
            onChangeText={setText}
            editable={!submitting}
            onSubmitEditing={submit}
            returnKeyType="send"
            submitBehavior="submit"
            multiline
          />
          <IconButton
            icon={ArrowUp}
            size="medium"
            type="primary"
            onPress={submit}
            disabled={submitting || !text.trim()}
            accessibilityLabel="Post comment"
          />
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { marginHorizontal: -16, backgroundColor: colors.neutral[100] },
  loader: { flex: 1 },
  list: { gap: 8, padding: 8, flexGrow: 1 },
  empty: { fontFamily: fonts.regular, fontSize: 14, color: colors.neutral[700], padding: 8 },
  error: { fontFamily: fonts.regular, fontSize: 14, color: colors.negative[700], padding: 8 },
  form: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 8 },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: colors.neutral[300],
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.neutral[900],
  },
});
