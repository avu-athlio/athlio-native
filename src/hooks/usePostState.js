import { useCallback, useRef, useState } from 'react';

import { clearLikeNotification, notifyLike } from '@/lib/feed';
import { like, unlike } from '@/lib/likes';

// Post list + liked set + optimistic Aura / comment counts, shared by the Home
// feed and profile post lists. State lives in the list owner, not the post
// rows: FlatList unmounts off-screen rows, so row state would reset.
export function usePostState(userId) {
  const [posts, setPosts] = useState([]);
  const [likedIds, setLikedIds] = useState(() => new Set());
  const pendingRef = useRef(new Set()); // like requests in flight

  // `liked` = the state the row is showing right now.
  const toggleLike = useCallback(
    async (postId, postAuthorId, liked) => {
      if (!userId || pendingRef.current.has(postId)) return;
      pendingRef.current.add(postId);

      const apply = (value, delta) => {
        setLikedIds((prev) => {
          const next = new Set(prev);
          if (value) next.add(postId);
          else next.delete(postId);
          return next;
        });
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, likes_count: Math.max(0, (Number(p.likes_count) || 0) + delta) } : p,
          ),
        );
      };

      const next = !liked;
      apply(next, next ? 1 : -1);
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
        apply(liked, next ? -1 : 1);
      } finally {
        pendingRef.current.delete(postId);
      }
    },
    [userId],
  );

  const commentAdded = useCallback((postId) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, comments_count: (Number(p.comments_count) || 0) + 1 } : p)),
    );
  }, []);

  // Append a page, skipping posts already shown.
  const appendPosts = useCallback((page, liked) => {
    setPosts((prev) => {
      const seen = new Set(prev.map((p) => p.id));
      return [...prev, ...page.filter((p) => !seen.has(p.id))];
    });
    setLikedIds((prev) => new Set([...prev, ...liked]));
  }, []);

  const replacePosts = useCallback((page, liked) => {
    setPosts(page);
    setLikedIds(new Set(liked));
  }, []);

  return { posts, likedIds, toggleLike, commentAdded, appendPosts, replacePosts };
}
