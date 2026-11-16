import { Image } from 'expo-image';
import { CheckCircle, MagnifyingGlass, Plus, X } from 'phosphor-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import StepHeader from '@/components/onboarding/StepHeader';
import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/ui/Button';
import UITextInput from '@/components/ui/TextInput';
import { getCurrentCity } from '@/lib/location';
import { supabase } from '@/lib/supabase';
import { colors, fonts, radius } from '@/theme';

function searchClubs(clubs, query) {
  const term = query.trim().toLowerCase();
  if (!term) return [];
  return clubs
    .filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.league?.toLowerCase().includes(term) ||
        c.country?.toLowerCase().includes(term),
    )
    .slice(0, 20);
}

// Clubs in the user's city first, then country, then anything.
function pickFeatured(clubs, userCity, userCountry) {
  const city = (userCity || '').toLowerCase().trim();
  const country = (userCountry || '').toLowerCase().trim();
  if (!city && !country) return clubs.slice(0, 4);

  const scored = clubs.map((c) => {
    let score = 0;
    if (city && c.city?.toLowerCase().includes(city)) score += 2;
    if (country && c.country?.toLowerCase().includes(country)) score += 1;
    return { ...c, _score: score };
  });
  const nearby = scored.filter((c) => c._score > 0).sort((a, b) => b._score - a._score);
  if (nearby.length >= 4) return nearby.slice(0, 4);
  return [...nearby, ...scored.filter((c) => c._score === 0).slice(0, 4 - nearby.length)];
}

function ClubLogo({ club }) {
  if (club.logo_url) {
    return <Image source={{ uri: club.logo_url }} style={styles.logo} contentFit="contain" />;
  }
  const initials =
    club.name
      .split(/\s+/)
      .filter((w) => /^[A-Z]/u.test(w))
      .slice(0, 2)
      .map((w) => w[0])
      .join('') || club.name[0];
  return (
    <View style={[styles.logo, styles.logoPlaceholder]}>
      <Text style={styles.logoInitials}>{initials}</Text>
    </View>
  );
}

function AddTeamSheet({ visible, onClose, onSubmit }) {
  const [clubName, setClubName] = useState('');
  const [city, setCity] = useState('');
  const [league, setLeague] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!clubName.trim() || saving) return;
    setSaving(true);
    try {
      await onSubmit({ clubName: clubName.trim(), city: city.trim(), league: league.trim() });
      setClubName('');
      setCity('');
      setLeague('');
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Add your team">
      <View style={styles.sheetBody}>
        <UITextInput label="Club name *" value={clubName} onChangeText={setClubName} autoFocus />
        <UITextInput label="City" value={city} onChangeText={setCity} />
        <UITextInput label="League or division" value={league} onChangeText={setLeague} />
        <Button size="big" label="Add club" onPress={submit} disabled={!clubName.trim() || saving} />
      </View>
    </BottomSheet>
  );
}

function VerificationSheet({ visible, onClose }) {
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(onClose, 2000);
    return () => clearTimeout(t);
  }, [visible, onClose]);

  return (
    <BottomSheet visible={visible} onClose={onClose} title="">
      <View style={styles.verifyBody}>
        <CheckCircle size={90} weight="light" color={colors.primary.default} />
        <Text style={styles.verifyTitle}>Got it.</Text>
        <Text style={styles.verifyText}>
          We will review your club and add it to our database shortly. You will be notified once it is
          verified.
        </Text>
      </View>
    </BottomSheet>
  );
}

export default function ClubPicker({ value, onChange, onNext, userCity, userCountry }) {
  const [query, setQuery] = useState('');
  const [clubs, setClubs] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showVerify, setShowVerify] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      let city = userCity || '';
      let country = userCountry || '';
      // Only use location if the user already granted it on the previous step.
      if (!city && !country) {
        const here = await getCurrentCity({ ask: false });
        city = here?.city || '';
        country = here?.country || '';
      }
      const { data, error } = await supabase
        .from('clubs')
        .select('id, name, league, country, city, logo_url')
        .order('name', { ascending: true });
      if (!active) return;
      if (error) console.error('clubs fetch error:', error);
      if (data) {
        setClubs(data);
        setFeatured(pickFeatured(data, city, country));
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [userCity, userCountry]);

  const searching = query.trim().length >= 2;
  const results = useMemo(() => searchClubs(clubs, query), [clubs, query]);
  const list = searching ? results : featured;
  const listLabel = searching
    ? 'Search results'
    : userCity || userCountry
      ? 'Nearby clubs'
      : 'Featured clubs';

  async function addTeam({ clubName, city, league }) {
    const { data, error } = await supabase
      .from('clubs')
      .insert({
        name: clubName,
        city: city || null,
        league: league || null,
        country: userCountry || null,
        sport: 'football',
      })
      .select('id')
      .single();
    onChange({ club_id: !error && data ? data.id : null, club_other_name: clubName });
    setShowAdd(false);
    setShowVerify(true);
  }

  return (
    <View style={styles.root}>
      <StepHeader title="Your Team" subtitle="Which team are you currently playing for?" />

      <View style={styles.search}>
        <MagnifyingGlass size={18} color={colors.neutral[700]} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search for your club..."
          placeholderTextColor={colors.neutral[700]}
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Search for your club"
          style={styles.searchInput}
        />
        {query ? (
          <Pressable hitSlop={8} onPress={() => setQuery('')} accessibilityLabel="Clear search">
            <X size={16} weight="bold" color={colors.neutral[700]} />
          </Pressable>
        ) : null}
      </View>

      <Text style={styles.listLabel}>{listLabel}</Text>

      <View style={styles.list}>
        {loading ? <ActivityIndicator color={colors.primary.default} style={styles.loader} /> : null}

        {!loading &&
          list.map((club) => {
            const selected = value?.club_id === club.id || value?.club_other_name === club.name;
            return (
              <Pressable
                key={club.id}
                onPress={() => onChange({ club_id: club.id, club_other_name: club.name })}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                style={({ pressed }) => [
                  styles.club,
                  selected && styles.clubSelected,
                  pressed && styles.pressed,
                ]}>
                <ClubLogo club={club} />
                <View style={styles.clubMeta}>
                  <Text style={styles.clubName} numberOfLines={1}>
                    {club.name}
                  </Text>
                  <Text style={styles.clubSub} numberOfLines={1}>
                    {[club.league, club.country].filter(Boolean).join(' · ')}
                  </Text>
                </View>
              </Pressable>
            );
          })}

        {!loading && searching && results.length === 0 ? (
          <Text style={styles.empty}>No clubs found for “{query}”</Text>
        ) : null}

        <Pressable
          onPress={() => setShowAdd(true)}
          accessibilityRole="button"
          style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}>
          <View style={styles.addIcon}>
            <Plus size={20} color={colors.primary.default} />
          </View>
          <Text style={styles.addLabel}>Add your team manually</Text>
        </Pressable>
      </View>

      <AddTeamSheet visible={showAdd} onClose={() => setShowAdd(false)} onSubmit={addTeam} />
      <VerificationSheet
        visible={showVerify}
        onClose={() => {
          setShowVerify(false);
          onNext?.();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  search: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: colors.neutral[100],
    marginBottom: 20,
  },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 16, color: colors.black },
  listLabel: { fontFamily: fonts.semibold, fontSize: 16, color: colors.black, marginBottom: 12 },
  list: { gap: 8 },
  loader: { marginVertical: 24 },
  club: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.white,
  },
  clubSelected: { borderColor: colors.primary.default, backgroundColor: colors.primary[50] },
  pressed: { opacity: 0.8 },
  logo: { width: 32, height: 32 },
  logoPlaceholder: {
    borderRadius: 6,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInitials: { fontFamily: fonts.bold, fontSize: 11, color: colors.neutral[500] },
  clubMeta: { flex: 1, gap: 2 },
  clubName: { fontFamily: fonts.semibold, fontSize: 16, color: colors.black },
  clubSub: { fontFamily: fonts.regular, fontSize: 13, color: colors.neutral[700] },
  empty: { fontFamily: fonts.regular, fontSize: 14, color: colors.neutral[700], paddingVertical: 8 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 8,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary[200],
    backgroundColor: colors.white,
  },
  addIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLabel: { fontFamily: fonts.semibold, fontSize: 16, color: colors.primary.default },
  sheetBody: { gap: 16, paddingBottom: 8 },
  verifyBody: { alignItems: 'center', gap: 12, paddingBottom: 24, paddingHorizontal: 8 },
  verifyTitle: { fontFamily: fonts.condensedBoldItalic, fontSize: 32, textTransform: 'uppercase', color: colors.black },
  verifyText: {
    fontFamily: fonts.medium,
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    color: colors.neutral[700],
  },
});
