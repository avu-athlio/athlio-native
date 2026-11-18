import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PageTopbar } from '@/components/navigation/Topbar';
import CommentsSheet from '@/components/post/CommentsSheet';
import PostSwitcher from '@/components/post/PostSwitcher';
import { useUser } from '@/context/UserContext';
import { usePostState } from '@/hooks/usePostState';
import { fetchLikedPostIds, fetchPost } from '@/lib/feed';
import { follow, isFollowing, unfollow } from '@/lib/follows';
import { colors, fonts } from '@/theme';

/**
 * One post, opened from a notification (the web's post/:id page was only a
 * placeholder). ?comments=1 opens the comments straight away.
 */
export default function PostPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const openComments = params.comments === '1';
  const { user } = useUser();
  const uid = user?.id;

  const { posts, likedIds, toggleLike, commentAdded, replacePosts } = usePostState(uid);
  const [status, setStatus] = useState('loading'); // loading | ready | missing | error
  const [following, setFollowing] = useState(true);
  const [commentsTarget, setCommentsTarget] = useState(null);

  useEffect(() => {
    if (!id || !uid) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const post = await fetchPost(id);
        if (cancelled) return;
        if (!post) return setStatus('missing');
        const authorId = post.profiles?.id || post.author_id;
        const [liked, follows] = await Promise.all([
          fetchLikedPostIds(uid, [post.id]),
          authorId === uid ? true : isFollowing(authorId).catch(() => true),
        ]);
        if (cancelled) return;
        replacePosts([post], liked);
        setFollowing(follows);
        setStatus('ready');
        if (openComments) setCommentsTarget({ postId: post.id, authorId });
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, uid, openComments, replacePosts]);

  const openProfile = useCallback(
    (pid) => {
      if (!pid) return;
      if (pid === uid) router.push('/profile');
      else router.push({ pathname: '/profile/[id]', params: { id: pid } });
    },
    [router, uid],
  );

  const toggleFollow = useCallback(async (authorId, wasFollowing) => {
    setFollowing(!wasFollowing);
    try {
      if (wasFollowing) await unfollow(authorId);
      else await follow(authorId);
    } catch {
      setFollowing(wasFollowing);
    }
  }, []);

  const post = posts[0];
  const authorId = post?.profiles?.id || post?.author_id;

  return (
    <View style={styles.screen}>
      <PageTopbar title="Post" />
      {status === 'loading' ? (
        <ActivityIndicator style={styles.loading} color={colors.primary.default} />
      ) : status !== 'ready' || !post ? (
        <Text style={styles.message}>
          {status === 'missing' ? 'This post has been deleted.' : 'Couldn’t load this post.'}
        </Text>
      ) : (
        <ScrollView contentContainerStyle={[styles.body, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
          <PostSwitcher
            post={post}
            liked={likedIds.has(post.id)}
            showFollow={authorId !== uid && !following}
            onToggleLike={toggleLike}
            onToggleFollow={(aid) => toggleFollow(aid, following)}
            onOpenComments={(postId, aid) => setCommentsTarget({ postId, authorId: aid })}
            onOpenProfile={openProfile}
          />
        </ScrollView>
      )}
      <CommentsSheet
        target={commentsTarget}
        onClose={() => setCommentsTarget(null)}
        onCommentAdded={commentAdded}
        onOpenProfile={(pid) => {
          setCommentsTarget(null);
          openProfile(pid);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.neutral.bg },
  body: { paddingTop: 8 },
  loading: { paddingVertical: 40 },
  message: { paddingVertical: 40, textAlign: 'center', fontFamily: fonts.regular, fontSize: 14, color: colors.neutral[600] },
});
