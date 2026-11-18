import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { follow, unfollow } from '@/lib/follows';
import { fetchIsFollowing, fetchProfile } from '@/lib/profile';
import { addToWatchlist, removeFromWatchlist } from '@/lib/watchlist';

/**
 * One profile + my relation to it (following / watchlisted).
 * Reloads whenever the screen comes back into focus, so follower counts and
 * edits made on other screens show up. `seed` (my context profile) lets my own
 * page render at once while the club join loads.
 */
export function useProfile(profileId, viewerId, seed = null) {
  const isMe = !!profileId && profileId === viewerId;
  const [profile, setProfile] = useState(seed);
  const [status, setStatus] = useState(seed ? 'ready' : 'loading'); // loading | ready | notfound | error
  const [relation, setRelation] = useState({ following: false, watchlisted: false });
  const [followBusy, setFollowBusy] = useState(false);
  const requestRef = useRef(0);
  const busyRef = useRef(false);

  const load = useCallback(() => {
    if (!profileId) return Promise.resolve();
    const request = ++requestRef.current;
    return Promise.all([fetchProfile(profileId), isMe || !viewerId ? null : fetchIsFollowing(viewerId, profileId)]).then(
      ([p, rel]) => {
        if (request !== requestRef.current) return;
        if (!p) {
          setStatus('notfound');
          return;
        }
        setProfile(p);
        if (rel) setRelation(rel);
        setStatus('ready');
      },
      (e) => {
        if (request !== requestRef.current) return;
        console.warn('profile load', e?.message);
        setStatus((s) => (s === 'ready' ? s : 'error'));
      },
    );
  }, [profileId, viewerId, isMe]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // Optimistic; the follower count moves with it instead of the web's
  // "wait 300ms and refetch the whole profile".
  const toggleFollow = useCallback(async () => {
    if (isMe || !viewerId || busyRef.current) return;
    busyRef.current = true;
    setFollowBusy(true);
    const next = !relation.following;
    const bump = (delta) =>
      setProfile((p) => (p ? { ...p, follower_count: Math.max(0, (Number(p.follower_count) || 0) + delta) } : p));

    // Unfollowing deletes the follows row, which also drops a watchlist save.
    setRelation((r) => ({ following: next, watchlisted: next ? r.watchlisted : false }));
    bump(next ? 1 : -1);
    try {
      if (next) await follow(profileId);
      else await unfollow(profileId);
    } catch (e) {
      console.warn('toggle follow', e?.message);
      setRelation((r) => ({ ...r, following: !next }));
      bump(next ? -1 : 1);
    } finally {
      busyRef.current = false;
      setFollowBusy(false);
    }
  }, [isMe, viewerId, profileId, relation.following]);

  // Scouts' watchlist lives on the follows row (upsert), so saving also follows.
  const toggleWatchlist = useCallback(async () => {
    if (isMe || !viewerId || busyRef.current) return;
    busyRef.current = true;
    const prev = relation;
    const next = !prev.watchlisted;
    setRelation({ following: next ? true : prev.following, watchlisted: next });
    if (next && !prev.following) {
      setProfile((p) => (p ? { ...p, follower_count: (Number(p.follower_count) || 0) + 1 } : p));
    }
    try {
      if (next) await addToWatchlist(profileId);
      else await removeFromWatchlist(profileId);
    } catch (e) {
      console.warn('toggle watchlist', e?.message);
      setRelation(prev);
      if (next && !prev.following) {
        setProfile((p) => (p ? { ...p, follower_count: Math.max(0, (Number(p.follower_count) || 0) - 1) } : p));
      }
    } finally {
      busyRef.current = false;
    }
  }, [isMe, viewerId, profileId, relation]);

  const retry = useCallback(() => {
    setStatus('loading');
    load();
  }, [load]);

  return {
    profile,
    setProfile,
    status,
    isMe,
    following: relation.following,
    watchlisted: relation.watchlisted,
    followBusy,
    load,
    retry,
    toggleFollow,
    toggleWatchlist,
  };
}
