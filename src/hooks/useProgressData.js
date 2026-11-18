import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { useUser } from '@/context/UserContext';
import {
  fetchMyMatches,
  fetchMyTrainingLog,
  fetchPlannedMatches,
  fetchTargets,
  planningMissing,
  targetsMissing,
  withProgress,
} from '@/lib/progress';

async function loadAll(uid) {
  const [matches, sessions, plannedMatches, t] = await Promise.all([
    fetchMyMatches(uid),
    fetchMyTrainingLog(uid),
    fetchPlannedMatches(uid).catch((e) => {
      if (planningMissing(e)) return [];
      throw e;
    }),
    fetchTargets(uid).then(
      (rows) => ({ rows, ready: true }),
      (e) => {
        if (targetsMissing(e)) return { rows: [], ready: false };
        throw e;
      },
    ),
  ]);
  const trainings = sessions.filter((s) => s.status === 'logged');
  const planned = sessions.filter((s) => s.status === 'planned');
  return {
    matches,
    trainings,
    planned,
    plannedMatches,
    targets: withProgress(t.rows, matches, trainings),
    targetsReady: t.ready,
  };
}

/**
 * The athlete's matches, logged trainings, planned sessions and matches, and
 * running targets (with their progress), reloaded whenever the screen comes into focus.
 * `targetsReady` is false until supabase/migrations/20261118_targets.sql has run.
 */
export default function useProgressData() {
  const { user } = useUser();
  const uid = user?.id;
  const [data, setData] = useState({
    matches: [],
    trainings: [],
    planned: [],
    plannedMatches: [],
    targets: [],
    targetsReady: true,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useFocusEffect(
    useCallback(() => {
      if (!uid) return undefined;
      let cancelled = false;
      loadAll(uid)
        .then((next) => {
          if (cancelled) return;
          setData(next);
          setError(null);
          setLoading(false);
        })
        .catch((e) => {
          if (cancelled) return;
          setError(e);
          setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, [uid]),
  );

  const reload = () =>
    uid &&
    loadAll(uid)
      .then((next) => {
        setData(next);
        setError(null);
      })
      .catch(setError);

  return { ...data, loading, error, reload };
}
