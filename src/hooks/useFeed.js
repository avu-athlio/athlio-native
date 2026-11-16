import { useCallback, useEffect, useRef, useState } from 'react';

import { useUser } from '@/context/UserContext';
import { POST_CREATED, on } from '@/lib/events';
import {
  FEED_PAGE_SIZE,
  clearLikeNotification,
  fetchFeedPage,
  fetchFollowingIds,
  fetchLikedPostIds,
  fetchSuggestedProfiles,
  notifyLike,
} from '@/lib/feed';
import { follow, unfollow } from '@/lib/follows';
import { like, unlike } from '@/lib/likes';

// All Home feed state lives here, not in the post components: FlatList unmounts
// off-screen rows, so per-post state (liked, counts) would reset while scrolling.
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

  const [posts, setPosts] = useState([]);
  const [likedIds, setLikedIds] = useState(() => new Set());
  const [followingIds, setFollowingIds] = useState(() => new Set());
  const [suggested, setSuggested] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const authorIdsRef = useRef([]);
  const requestRef = useRef(0); // ignore results from superseded loads
  const pendingRef = useRef(new Set()); // like/follow requests in flight

  const load = useCallback(() => {
    if (!userId) return Promise.resolve();
    const request = ++requestRef.current;
    return fetchFirstPage(userId).then(
      ({ following, authorIds, page, suggestions, liked }) => {
        if (request !== requestRef.current) return;
        authorIdsRef.current = authorIds;
        setFollowingIds(new Set(following));
        setPosts(page);
        setLikedIds(new Set(liked));
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
  }, [userId]);

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
      setPosts((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        return [...prev, ...page.filter((p) => !seen.has(p.id))];
      });
      setLikedIds((prev) => new Set([...prev, ...liked]));
      setHasMore(page.length === FEED_PAGE_SIZE);
    } catch (e) {
      console.warn('feed load more', e?.message);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, status, posts, userId]);

  const bumpLikes = (postId, delta) =>
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, likes_count: Math.max(0, (Number(p.likes_count) || 0) + delta) } : p,
      ),
    );

  const setLiked = (postId, value) =>
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (value) next.add(postId);
      else next.delete(postId);
      return next;
    });

  // `liked` = the state the row is showing right now.
  const toggleLike = useCallback(
    async (postId, postAuthorId, liked) => {
      const key = `like:${postId}`;
      if (!userId || pendingRef.current.has(key)) return;
      pendingRef.current.add(key);

      const next = !liked;
      setLiked(postId, next);
      bumpLikes(postId, next ? 1 : -1);
      try {
        if (next) {
          await like(postId);
          await notifyLike({ postId, postAuthorId, userId });
        } else {
          await unlike(postId);
          await clearLikeNotification({ postId, userId });
        }
      } catch (e) {
        console.warn('toggle like', e?.message);
        setLiked(postId, liked);
        bumpLikes(postId, next ? -1 : 1);
      } finally {
        pendingRef.current.delete(key);
      }
    },
    [userId],
  );

  const toggleFollow = useCallback(
    async (authorId, following) => {
      const key = `follow:${authorId}`;
      if (!userId || authorId === userId || pendingRef.current.has(key)) return;
      pendingRef.current.add(key);

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
        pendingRef.current.delete(key);
      }
    },
    [userId],
  );

  const commentAdded = useCallback((postId) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, comments_count: (Number(p.comments_count) || 0) + 1 } : p)),
    );
  }, []);

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
