import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import SuggestedAccounts from '@/components/feed/SuggestedAccounts';
import { useTabBarSpace } from '@/components/navigation/TabBar';
import CommentsSheet from '@/components/post/CommentsSheet';
import PostSwitcher from '@/components/post/PostSwitcher';
import Button from '@/components/ui/Button';
import { useFeed } from '@/hooks/useFeed';
import { colors, fonts } from '@/theme';

// Port of the web Feed: my posts + posts from people I follow, newest first,
// with "Suggested for you" after every second post (as on the web).
export default function Feed() {
  const router = useRouter();
  const bottomSpace = useTabBarSpace();
  const feed = useFeed();
  const { userId, posts, likedIds, followingIds, suggested, toggleLike, toggleFollow, commentAdded } = feed;

  const [commentsTarget, setCommentsTarget] = useState(null);

  const openProfile = useCallback(
    (id) => {
      if (!id) return;
      if (id === userId) router.push('/profile');
      else router.push({ pathname: '/profile/[id]', params: { id } });
    },
    [router, userId],
  );

  const openComments = useCallback((postId, authorId) => setCommentsTarget({ postId, authorId }), []);

  const renderItem = useCallback(
    ({ item, index }) => {
      const authorId = item.profiles?.id || item.author_id;
      return (
        <View style={styles.item}>
          <PostSwitcher
            post={item}
            liked={likedIds.has(item.id)}
            showFollow={authorId !== userId && !followingIds.has(authorId)}
            onToggleLike={toggleLike}
            onToggleFollow={toggleFollow}
            onOpenComments={openComments}
            onOpenProfile={openProfile}
          />
          {suggested.length > 0 && index > 0 && index % 2 === 0 ? (
            <SuggestedAccounts profiles={suggested} onOpenProfile={openProfile} />
          ) : null}
        </View>
      );
    },
    [likedIds, followingIds, userId, suggested, toggleLike, toggleFollow, openComments, openProfile],
  );

  const contentStyle = useMemo(() => [styles.content, { paddingBottom: bottomSpace }], [bottomSpace]);

  if (feed.status === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary.default} />
      </View>
    );
  }

  if (feed.status === 'error') {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>{feed.error}</Text>
        <Button type="secondary" size="small" label="Try again" onPress={feed.retry} />
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={posts}
        keyExtractor={(p) => String(p.id)}
        renderItem={renderItem}
        contentContainerStyle={contentStyle}
        refreshControl={
          <RefreshControl refreshing={feed.refreshing} onRefresh={feed.refresh} tintColor={colors.primary.default} />
        }
        onEndReached={feed.loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View>
            <Text style={[styles.message, styles.empty]}>No posts yet. Follow athletes to see their activity here.</Text>
            <SuggestedAccounts profiles={suggested} onOpenProfile={openProfile} />
          </View>
        }
        ListFooterComponent={
          feed.loadingMore ? <ActivityIndicator style={styles.footer} color={colors.primary.default} /> : null
        }
        removeClippedSubviews
        windowSize={7}
      />

      <CommentsSheet
        target={commentsTarget}
        onClose={() => setCommentsTarget(null)}
        onCommentAdded={commentAdded}
        onOpenProfile={openProfile}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 16, paddingHorizontal: 8, gap: 12 },
  item: { gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  message: { fontFamily: fonts.regular, fontSize: 16, color: colors.neutral[700], textAlign: 'center' },
  empty: { paddingVertical: 48, paddingHorizontal: 24 },
  footer: { paddingVertical: 16 },
});
