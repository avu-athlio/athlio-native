import { createContext, useContext, useEffect, useRef, useState } from 'react';

import { supabase } from '@/lib/supabase';
import { isProfessional } from '@/utils/roles';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const currentUid = useRef(null);
  const [counts, setCounts] = useState({ notifications: 0, messages: 0 });

  async function loadProfile(uid) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle();
    setProfile(data ?? null);
  }

  useEffect(() => {
    let active = true;

    // Restore the persisted session on launch. `loading` stays true until the
    // profile is known so the router can pick onboarding vs. app correctly.
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!active) return;
      const u = session?.user ?? null;
      setUser(u);
      currentUid.current = u?.id ?? null;
      if (u) await loadProfile(u.id);
      if (active) setLoading(false);
    });

    // Login, logout and token refresh. Only reload the profile when the signed-in
    // user actually changes (token refreshes fire this too), and hold
    // `profileLoading` meanwhile so the router doesn't flash the wrong screens.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      const uid = u?.id ?? null;
      if (uid === currentUid.current) return;
      currentUid.current = uid;
      if (uid) {
        setProfileLoading(true);
        // Defer: Supabase deadlocks if you await its client inside this callback.
        setTimeout(() => {
          loadProfile(uid).finally(() => {
            if (active) setProfileLoading(false);
          });
        }, 0);
      } else {
        setProfile(null);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const role = profile?.role || 'athlete';
  const isScout = isProfessional(role);
  // Same rule as the web app: onboarding is finished once a username is set.
  const isOnboarded = !!profile?.username;

  const canPost = (postType) => {
    if (!user) return false;
    if (postType === 'match' || postType === 'training' || postType === 'activity') return !isScout;
    return true;
  };

  const refreshProfile = () => (user ? loadProfile(user.id) : Promise.resolve());

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        profile,
        setProfile,
        refreshProfile,
        loading,
        profileLoading,
        counts,
        setCounts,
        role,
        isScout,
        isOnboarded,
        canPost,
      }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}
