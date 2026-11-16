import * as Notifications from 'expo-notifications';
import { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import OnboardingNavbar from '@/components/onboarding/OnboardingNavbar';
import OnboardingTopbar from '@/components/onboarding/OnboardingTopbar';
import AddHighlight from '@/components/onboarding/steps/AddHighlight';
import ClubPicker from '@/components/onboarding/steps/ClubPicker';
import DateOfBirth from '@/components/onboarding/steps/DateOfBirth';
import FindPeople from '@/components/onboarding/steps/FindPeople';
import GoalsSelect from '@/components/onboarding/steps/GoalsSelect';
import LocationFields from '@/components/onboarding/steps/LocationFields';
import NameAndPhoto from '@/components/onboarding/steps/NameAndPhoto';
import NotificationsStep from '@/components/onboarding/steps/Notifications';
import PlayingStyle from '@/components/onboarding/steps/PlayingStyle';
import PositionSelect from '@/components/onboarding/steps/PositionSelect';
import PreferredLeg from '@/components/onboarding/steps/PreferredLeg';
import Premium from '@/components/onboarding/steps/Premium';
import ProfessionalRole from '@/components/onboarding/steps/ProfessionalRole';
import RoleSelect from '@/components/onboarding/steps/RoleSelect';
import { useUser } from '@/context/UserContext';
import { getCurrentCity } from '@/lib/location';
import { postHighlight, saveOnboarding } from '@/lib/onboarding';
import { supabase } from '@/lib/supabase';
import { colors } from '@/theme';
import { getSteps } from '@/utils/steps';

const TOPBAR_H = 52;
const PRO_ROLES = ['professional', 'scout', 'coach', 'manager', 'agent'];

// Steps whose layout fills the screen; everything else scrolls.
const FIXED_STEPS = new Set(['role', 'profession', 'name', 'dob', 'position', 'leg', 'location', 'notifications', 'premium']);

const EMPTY_FORM = {
  full_name: '',
  username: '',
  avatar_url: '',
  sports: [],
  primarySport: 'football',
  gender: '',
  position: [],
  bio: '',
  club_id: null,
  club_other_name: '',
  country: '',
  region: '',
  city: '',
  coords: null,
  dob: '',
  goals: '',
  professionalType: '',
  playingStyle: '',
  preferredLeg: '',
  talent_preferences: '',
};

function formFromProfile(profile, user) {
  const sports = Array.isArray(profile?.sports) ? profile.sports : [];
  const meta = user?.user_metadata ?? {};
  return {
    ...EMPTY_FORM,
    full_name: profile?.full_name || meta.full_name || meta.name || '',
    username: profile?.username || '',
    avatar_url: profile?.avatar_url || '',
    sports,
    primarySport: profile?.primary_sport || sports[0] || 'football',
    gender: profile?.gender || '',
    position: profile?.position ? (Array.isArray(profile.position) ? profile.position : [profile.position]) : [],
    bio: profile?.bio || '',
    club_id: profile?.club_id || null,
    club_other_name: profile?.club_other_name || '',
    country: profile?.country || '',
    region: profile?.region || '',
    city: profile?.city || '',
    goals: profile?.goals || '',
    talent_preferences: profile?.talent_preferences ? JSON.stringify(profile.talent_preferences) : '',
  };
}

async function requestNotificationPermission() {
  try {
    if (Platform.OS === 'android') {
      // Android 13+ only shows the prompt once a channel exists.
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        // AndroidImportance.DEFAULT. The enum is re-exported via `export *`,
        // which eslint's import/namespace rule can't follow.
        importance: 5,
      });
    }
    await Notifications.requestPermissionsAsync();
  } catch {
    // Not fatal: the user can enable notifications later in Settings.
  }
}

export default function SetupProfile() {
  const insets = useSafeAreaInsets();
  const { user, profile, setProfile } = useUser();

  const [role, setRole] = useState(() => profile?.role || '');
  const [form, setForm] = useState(() => formFromProfile(profile, user));
  const [avatar, setAvatar] = useState(null); // freshly picked local photo
  const [highlight, setHighlight] = useState({ media: null, text: '', match: '' });
  const [idx, setIdx] = useState(0);
  const [busy, setBusy] = useState(false);

  const steps = useMemo(() => getSteps(role), [role]);
  // Clamp in case the role (and so the step list) changed under us.
  const stepIdx = Math.min(idx, steps.length - 1);
  const stepId = steps[stepIdx];
  const isPro = PRO_ROLES.includes(role);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const next = () => setIdx(Math.min(stepIdx + 1, steps.length - 1));

  function back() {
    if (stepIdx > 0) return setIdx(stepIdx - 1);
    Alert.alert('Leave setup?', 'You can finish setting up your profile next time you sign in.', [
      { text: 'Stay', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => supabase.auth.signOut() },
    ]);
  }

  async function withBusy(fn) {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  }

  const submitHighlight = () =>
    withBusy(async () => {
      await postHighlight(user.id, highlight);
      next();
    });

  const enableNotifications = () =>
    withBusy(async () => {
      await requestNotificationPermission();
      next();
    });

  const locateMe = () =>
    withBusy(async () => {
      const here = await getCurrentCity();
      if (here) set({ city: here.city, country: here.country, coords: { lat: here.lat, lon: here.lon } });
      next();
    });

  const finish = () =>
    withBusy(async () => {
      try {
        const saved = await saveOnboarding({ uid: user.id, role, form, avatar });
        // Setting a profile with a username unlocks the main app (see root layout).
        setProfile((p) => ({ ...p, ...saved }));
      } catch (e) {
        console.error('PROFILE SAVE ERROR', e);
        Alert.alert('Could not save your profile', e?.message ?? 'Please try again.');
      }
    });

  const canContinue = (() => {
    switch (stepId) {
      case 'role':
        return Boolean(role);
      case 'profession':
        return Boolean(form.professionalType);
      case 'name':
        return form.full_name.trim() !== '';
      case 'position':
        return form.position.length > 0;
      case 'leg':
        return Boolean(form.preferredLeg);
      case 'club':
        return Boolean(form.club_id) || (form.club_other_name || '').trim() !== '';
      default:
        return true;
    }
  })();

  const askForLocation = stepId === 'location' && !form.city;
  const primaryLabel =
    stepId === 'highlight'
      ? 'Post'
      : stepId === 'notifications'
        ? 'Turn on notifications'
        : askForLocation
          ? 'Give access to location'
          : 'Continue';
  const onPrimary =
    stepId === 'highlight'
      ? submitHighlight
      : stepId === 'notifications'
        ? enableNotifications
        : askForLocation
          ? locateMe
          : next;

  const SKIPPABLE = ['goals', 'highlight', 'notifications', 'location', 'find-people'];
  const secondaryLabel = stepId === 'club' ? "I'm not in a club" : SKIPPABLE.includes(stepId) ? 'Skip' : null;
  const onSecondary =
    stepId === 'club'
      ? () => {
          set({ club_id: null, club_other_name: '' });
          next();
        }
      : secondaryLabel
        ? next
        : null;

  const dark = stepId === 'position';

  const stepContent = (() => {
    switch (stepId) {
      case 'role':
        return <RoleSelect role={role} onChange={setRole} />;
      case 'profession':
        return <ProfessionalRole value={form.professionalType} onChange={(v) => set({ professionalType: v })} />;
      case 'name':
        return (
          <NameAndPhoto
            name={form.full_name}
            avatarUrl={avatar?.uri || form.avatar_url}
            onNameChange={(v) => set({ full_name: v })}
            onAvatarChange={setAvatar}
          />
        );
      case 'dob':
        return <DateOfBirth value={form.dob} onChange={(v) => set({ dob: v })} />;
      case 'style':
        return (
          <PlayingStyle
            value={form.playingStyle}
            onChange={(v) => set({ playingStyle: v })}
            positions={form.position}
          />
        );
      case 'leg':
        return <PreferredLeg value={form.preferredLeg} onChange={(v) => set({ preferredLeg: v })} />;
      case 'location':
        return <LocationFields city={form.city} country={form.country} coords={form.coords} onChange={set} />;
      case 'club':
        return (
          <ClubPicker
            value={{ club_id: form.club_id, club_other_name: form.club_other_name }}
            userCity={form.city}
            userCountry={form.country}
            onChange={set}
            onNext={next}
          />
        );
      case 'goals':
        return <GoalsSelect value={form.goals} onChange={(v) => set({ goals: v })} />;
      case 'highlight':
        return (
          <AddHighlight
            media={highlight.media}
            text={highlight.text}
            match={highlight.match}
            onMediaChange={(media) => setHighlight((h) => ({ ...h, media }))}
            onTextChange={(text) => setHighlight((h) => ({ ...h, text }))}
            onMatchChange={(match) => setHighlight((h) => ({ ...h, match }))}
          />
        );
      case 'notifications':
        return <NotificationsStep />;
      case 'find-people':
        return <FindPeople userId={user?.id} sport={form.primarySport} position={form.position} />;
      case 'premium':
        return <Premium professional={isPro} onFinish={finish} busy={busy} bottomInset={insets.bottom} />;
      default:
        return null;
    }
  })();

  return (
    <View style={[styles.root, dark && styles.rootDark]}>
      {stepId === 'position' ? (
        <PositionSelect
          value={form.position}
          onChange={(v) => set({ position: v })}
          contentTop={insets.top + TOPBAR_H}
        />
      ) : null}

      <View style={{ paddingTop: insets.top }}>
        <OnboardingTopbar
          onBack={back}
          onClose={stepId === 'premium' ? finish : undefined}
          currentStep={stepId === 'role' ? 1 : stepIdx + 1}
          totalSteps={stepId === 'role' ? 10 : Math.max(steps.length, 1)}
          dark={dark}
        />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        pointerEvents="box-none"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {stepId === 'position' ? (
          <View style={styles.flex} pointerEvents="box-none" />
        ) : FIXED_STEPS.has(stepId) ? (
          <View style={styles.content}>{stepContent}</View>
        ) : (
          <ScrollView
            key={stepId}
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag">
            {stepContent}
          </ScrollView>
        )}

        {stepId !== 'premium' ? (
          <OnboardingNavbar
            onNext={onPrimary}
            onFinish={finish}
            showFinish={stepIdx === steps.length - 1}
            canContinue={canContinue}
            busy={busy}
            dark={dark}
            primaryLabel={primaryLabel}
            secondaryLabel={secondaryLabel}
            onSecondary={onSecondary}
          />
        ) : null}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.neutral.bg },
  rootDark: { backgroundColor: colors.black },
  flex: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },
});
