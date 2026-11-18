import { useCallback, useEffect, useRef, useState } from 'react';

import { usePostState } from '@/hooks/usePostState';
import { POST_CREATED, on } from '@/lib/events';
import { FEED_PAGE_SIZE, fetchFeedPage, fetchLikedPostIds } from '@/lib/feed';

// One profile's posts, newest first, paged like the feed (the web loaded all).
export function useProfilePosts(profileId, viewerId) {
  const { posts, likedIds, toggleLike, commentAdded, appendPosts, replacePosts } = usePostState(viewerId);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const requestRef = useRef(0);

  const load = useCallback(() => {
    if (!profileId || !viewerId) return Promise.resolve();
    const request = ++requestRef.current;
    return fetchFeedPage([profileId])
      .then(async (page) => ({ page, liked: await fetchLikedPostIds(viewerId, page.map((p) => p.id)) }))
      .then(
        ({ page, liked }) => {
          if (request !== requestRef.current) return;
          replacePosts(page, liked);
          setHasMore(page.length === FEED_PAGE_SIZE);
          setStatus('ready');
        },
        (e) => {
          if (request !== requestRef.current) return;
          console.warn('profile posts', e?.message);
          setStatus((s) => (s === 'ready' ? s : 'error'));
        },
      );
  }, [profileId, viewerId, replacePosts]);

  useEffect(() => {
    load();
  }, [load]);

  // My own profile picks up new posts.
  useEffect(() => (profileId === viewerId ? on(POST_CREATED, () => load()) : undefined), [load, profileId, viewerId]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || status !== 'ready' || !posts.length) return;
    setLoadingMore(true);
    try {
      const page = await fetchFeedPage([profileId], posts[posts.length - 1].created_at);
      const liked = await fetchLikedPostIds(viewerId, page.map((p) => p.id));
      appendPosts(page, liked);
      setHasMore(page.length === FEED_PAGE_SIZE);
    } catch (e) {
      console.warn('profile posts more', e?.message);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, status, posts, profileId, viewerId, appendPosts]);

  const retry = useCallback(() => {
    setStatus('loading');
    load();
  }, [load]);

  return { posts, likedIds, status, loadingMore, load, retry, loadMore, toggleLike, commentAdded };
}
