import { useCallback, useEffect, useRef, useState } from 'react';

import { useUser } from '@/context/UserContext';
import { usePostState } from '@/hooks/usePostState';
import { POST_CREATED, on } from '@/lib/events';
import {
  FEED_PAGE_SIZE,
  fetchFeedPage,
  fetchFollowingIds,
  fetchLikedPostIds,
  fetchSuggestedProfiles,
} from '@/lib/feed';
import { follow, unfollow } from '@/lib/follows';

// Home feed state. Posts / likes / comment counts come from usePostState;
// this adds the author list, suggestions, follow state and paging.
// Mutations are optimistic and roll back on error.
async function fetchFirstPage(userId) {
  const following = await fetchFollowingIds(userId);
  // Always include my own posts.
  const authorIds = Array.from(new Set([userId, ...following]));
  const [page, suggestions] = await Promise.all([
    fetchFeedPage(authorIds),
    fetchSuggestedProfiles(authorIds).catch(() => []),
  ]);
  const liked = await fetchLikedPostIds(userId, page.map((p) => p.id));
  return { following, authorIds, page, suggestions, liked };
}

export function useFeed() {
  const { user } = useUser();
  const userId = user?.id ?? null;

  const { posts, likedIds, toggleLike, commentAdded, appendPosts, replacePosts } = usePostState(userId);
  const [followingIds, setFollowingIds] = useState(() => new Set());
  const [suggested, setSuggested] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const authorIdsRef = useRef([]);
  const requestRef = useRef(0); // ignore results from superseded loads
  const pendingFollowRef = useRef(new Set());

  const load = useCallback(() => {
    if (!userId) return Promise.resolve();
    const request = ++requestRef.current;
    return fetchFirstPage(userId).then(
      ({ following, authorIds, page, suggestions, liked }) => {
        if (request !== requestRef.current) return;
        authorIdsRef.current = authorIds;
        setFollowingIds(new Set(following));
        replacePosts(page, liked);
        setSuggested(suggestions);
        setHasMore(page.length === FEED_PAGE_SIZE);
        setError(null);
        setStatus('ready');
      },
      (e) => {
        if (request !== requestRef.current) return;
        setError(e?.message ?? 'Could not load the feed.');
        // Keep showing the old posts if a refresh fails.
        setStatus((s) => (s === 'ready' ? s : 'error'));
      },
    );
  }, [userId, replacePosts]);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const retry = useCallback(() => {
    setStatus('loading');
    load();
  }, [load]);

  // Refresh after the user publishes a post.
  useEffect(() => on(POST_CREATED, () => load()), [load]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || status !== 'ready' || !posts.length) return;
    setLoadingMore(true);
    try {
      const before = posts[posts.length - 1].created_at;
      const page = await fetchFeedPage(authorIdsRef.current, before);
      const liked = await fetchLikedPostIds(userId, page.map((p) => p.id));
      appendPosts(page, liked);
      setHasMore(page.length === FEED_PAGE_SIZE);
    } catch (e) {
      console.warn('feed load more', e?.message);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, status, posts, userId, appendPosts]);

  const toggleFollow = useCallback(
    async (authorId, following) => {
      if (!userId || authorId === userId || pendingFollowRef.current.has(authorId)) return;
      pendingFollowRef.current.add(authorId);

      const apply = (value) =>
        setFollowingIds((prev) => {
          const next = new Set(prev);
          if (value) next.add(authorId);
          else next.delete(authorId);
          return next;
        });

      apply(!following);
      try {
        if (following) await unfollow(authorId);
        else await follow(authorId);
      } catch (e) {
        console.warn('toggle follow', e?.message);
        apply(following);
      } finally {
        pendingFollowRef.current.delete(authorId);
      }
    },
    [userId],
  );

  return {
    userId,
    posts,
    likedIds,
    followingIds,
    suggested,
    status,
    error,
    refreshing,
    loadingMore,
    hasMore,
    refresh,
    retry,
    loadMore,
    toggleLike,
    toggleFollow,
    commentAdded,
  };
}
