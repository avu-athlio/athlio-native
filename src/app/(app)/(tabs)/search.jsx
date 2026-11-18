import { useFocusEffect, useRouter } from 'expo-router';
import { SlidersHorizontal } from 'phosphor-react-native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Keyboard, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import SuggestedFollowCard from '@/components/feed/SuggestedFollowCard';
import { useTabBarSpace } from '@/components/navigation/TabBar';
import { ClubBubbleRow, ClubRow } from '@/components/search/Clubs';
import EventCard from '@/components/search/EventCard';
import EventSheet from '@/components/search/EventSheet';
import FiltersSheet from '@/components/search/FiltersSheet';
import SearchChips from '@/components/search/SearchChips';
import PlayerCard from '@/components/ui/PlayerCard';
import SearchBar from '@/components/ui/SearchBar';
import { useUser } from '@/context/UserContext';
import { getCurrentCity } from '@/lib/location';
import { addRecentSearch, getRecentSearches } from '@/lib/recentSearches';
import {
  EMPTY_FILTERS,
  countFilters,
  fetchClubsInCountry,
  fetchEvents,
  fetchPopularClubs,
  fetchSuggestions,
  findClubs,
  searchProfiles,
} from '@/lib/search';
import { colors, fonts } from '@/theme';

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'athletes', label: 'Athletes' },
  { value: 'professionals', label: 'Professionals' },
  { value: 'events', label: 'Events' },
  { value: 'clubs', label: 'Clubs' },
];
// Which advanced-filter group applies on each tab.
const GROUP = { athletes: 'athletes', professionals: 'professionals', events: 'events' };

function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/**
 * Figma Search (port of the web ProfileSearch). Browsing shows each tab's
 * sections; typing 2+ letters or applying advanced filters switches to results.
 */
export default function Search() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarSpace = useTabBarSpace();
  const { user, profile } = useUser();
  const uid = user?.id;

  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const term = useDebounced(query.trim());
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [event, setEvent] = useState(null);

  const group = GROUP[tab];
  const activeCount = group ? countFilters(group, filters[group]) : 0;
  const totalCount = Object.keys(EMPTY_FILTERS).reduce((n, g) => n + countFilters(g, filters[g]), 0);
  const searching = term.length >= 2 || activeCount > 0;

  // ── Browse data ──
  const [recents, setRecents] = useState([]);
  const [suggested, setSuggested] = useState({});
  const [popularClubs, setPopularClubs] = useState(null);
  const [countryClubs, setCountryClubs] = useState(null);
  const [events, setEvents] = useState(null); // { events, past }

  useFocusEffect(
    useCallback(() => {
      setRecents(getRecentSearches(uid));
    }, [uid]),
  );

  useEffect(() => {
    let cancelled = false;
    fetchPopularClubs()
      .then((c) => !cancelled && setPopularClubs(c))
      .catch(() => !cancelled && setPopularClubs([]));
    // Only use location if it was already allowed — Search shouldn't prompt for it.
    getCurrentCity({ ask: false })
      .then((here) => fetchEvents({ here: here ? { lat: here.lat, lon: here.lon } : null }))
      .then((r) => !cancelled && setEvents(r))
      .catch(() => !cancelled && setEvents({ events: [], past: false }));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if ((tab !== 'athletes' && tab !== 'professionals') || suggested[tab] || !uid) return undefined;
    let cancelled = false;
    fetchSuggestions({ kind: tab, uid, country: profile?.country })
      .then((rows) => !cancelled && setSuggested((s) => ({ ...s, [tab]: rows })))
      .catch(() => !cancelled && setSuggested((s) => ({ ...s, [tab]: [] })));
    return () => {
      cancelled = true;
    };
  }, [tab, uid, profile?.country, suggested]);

  useEffect(() => {
    if (tab !== 'clubs' || countryClubs) return undefined;
    let cancelled = false;
    fetchClubsInCountry(profile?.country)
      .then((c) => !cancelled && setCountryClubs(c))
      .catch(() => !cancelled && setCountryClubs([]));
    return () => {
      cancelled = true;
    };
  }, [tab, countryClubs, profile?.country]);

  // ── Results ──
  // Each response is tagged with the search it answers; a stale one is ignored.
  const searchKey = searching ? JSON.stringify([term, tab, group ? filters[group] : null]) : null;
  const [response, setResponse] = useState({ key: null, results: null, error: false });
  const current = response.key === searchKey ? response : { results: null, error: false };

  useEffect(() => {
    if (!searchKey) return undefined;
    let cancelled = false;
    const people = (kind, f) => searchProfiles({ term, kind, filters: f, excludeId: uid });
    const job =
      tab === 'all'
        ? Promise.all([people('all', null), findClubs(term, 10), fetchEvents({ term, limit: 5 })]).then(([p, c, e]) => ({
            people: p,
            clubs: c,
            events: e.events,
          }))
        : tab === 'clubs'
          ? findClubs(term).then((c) => ({ clubs: c }))
          : tab === 'events'
            ? fetchEvents({ term, filters: filters.events, limit: 30 }).then((e) => ({ events: e.events }))
            : people(tab, filters[tab]).then((p) => ({ people: p }));
    job.then(
      (results) => !cancelled && setResponse({ key: searchKey, results, error: false }),
      () => !cancelled && setResponse({ key: searchKey, results: null, error: true }),
    );
    return () => {
      cancelled = true;
    };
    // searchKey already captures term, tab and the active filter group.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchKey]);

  // ── Actions ──
  const openProfile = (p) => {
    Keyboard.dismiss();
    addRecentSearch(uid, p);
    if (p.id === uid) router.push('/profile');
    else router.push({ pathname: '/profile/[id]', params: { id: p.id } });
  };

  // No club page yet: a club shows its athletes (the Team filter).
  const openClub = (club) => {
    Keyboard.dismiss();
    setFilters((f) => ({ ...f, athletes: { ...EMPTY_FILTERS.athletes, team: club } }));
    setQuery('');
    setTab('athletes');
  };

  const applyFilters = (next, fromGroup) => {
    setFilters(next);
    setFiltersOpen(false);
    if (countFilters(fromGroup, next[fromGroup]) > 0) setTab(fromGroup);
  };

  const recentFor = (kind) => (kind === 'all' ? recents : getRecentSearches(uid, kind)).slice(0, 3);

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <SearchBar value={query} onChangeText={setQuery} placeholder="Search athletes, scouts..." />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={totalCount ? `Advanced filters, ${totalCount} on` : 'Advanced filters'}
            hitSlop={10}
            onPress={() => setFiltersOpen(true)}>
            <SlidersHorizontal size={24} color={colors.primary.default} />
            {totalCount ? <View style={styles.dot} /> : null}
          </Pressable>
        </View>
        <SearchChips options={TABS} value={tab} onChange={setTab} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: tabBarSpace + 16 }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag">
        {searching ? (
          <Results
            tab={tab}
            results={current.results}
            error={current.error}
            filterNote={activeCount ? activeFilterNote(group, filters[group]) : null}
            onClearFilters={() => setFilters((f) => ({ ...f, [group]: EMPTY_FILTERS[group] }))}
            onOpenProfile={openProfile}
            onOpenClub={openClub}
            onOpenEvent={setEvent}
          />
        ) : tab === 'all' ? (
          <>
            <RecentSection people={recentFor('all')} onOpen={openProfile} />
            <Section title="Clubs" loading={!popularClubs} empty={popularClubs?.length === 0}>
              <ClubBubbleRow clubs={popularClubs ?? []} onPressClub={openClub} />
            </Section>
            <EventsSection data={events} variant="big" onOpen={setEvent} />
          </>
        ) : tab === 'athletes' || tab === 'professionals' ? (
          <>
            <RecentSection people={recentFor(tab)} onOpen={openProfile} />
            <Section title="Suggested for you" loading={!suggested[tab]} empty={suggested[tab]?.length === 0}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.cards}>
                {(suggested[tab] ?? []).map((p) => (
                  <SuggestedFollowCard
                    key={p.id}
                    name={p.full_name || p.username}
                    avatarUrl={p.avatar_url}
                    verified={p.verified}
                    position={p.position}
                    role={tab === 'professionals' ? p.role : undefined}
                    clubName={p.club?.name}
                    onPress={() => openProfile(p)}
                  />
                ))}
              </ScrollView>
            </Section>
          </>
        ) : tab === 'events' ? (
          <EventsSection data={events} variant="small" titleUpcoming="Events near you" onOpen={setEvent} />
        ) : (
          <>
            <Section title="Most popular" loading={!popularClubs} empty={popularClubs?.length === 0}>
              <ClubBubbleRow clubs={popularClubs ?? []} onPressClub={openClub} />
            </Section>
            <Section
              title="Near you"
              loading={!countryClubs}
              empty={countryClubs?.length === 0}
              emptyText={profile?.country ? 'No clubs in your country yet.' : 'Add your country to your profile to see clubs near you.'}>
              <View style={styles.list}>
                {(countryClubs ?? []).map((c) => (
                  <ClubRow key={c.id} club={c} onPress={() => openClub(c)} />
                ))}
              </View>
            </Section>
          </>
        )}
      </ScrollView>

      <FiltersSheet
        visible={filtersOpen}
        initialGroup={group ?? 'athletes'}
        filters={filters}
        country={profile?.country}
        onApply={applyFilters}
        onClose={() => setFiltersOpen(false)}
      />
      <EventSheet event={event} onClose={() => setEvent(null)} />
    </View>
  );
}

function activeFilterNote(group, f) {
  const bits = [];
  if (group === 'athletes') {
    if (f.team) bits.push(f.team.name);
    if (f.league) bits.push(f.league);
    if (f.positions.length) bits.push(f.positions.join(', '));
    if (f.age[0] !== EMPTY_FILTERS.athletes.age[0] || f.age[1] !== EMPTY_FILTERS.athletes.age[1]) bits.push(`Age ${f.age[0]}–${f.age[1]}`);
  } else if (group === 'professionals') {
    if (f.league) bits.push(f.league);
    if (f.roles.length) bits.push(f.roles.join(', '));
  } else {
    if (f.place.trim()) bits.push(f.place.trim());
    if (f.from || f.to) bits.push([f.from, f.to].map((d) => d && d.split('-').reverse().join('/')).filter(Boolean).join(' – '));
  }
  return bits.join(' · ');
}

function Section({ title, loading, empty, emptyText, children }) {
  if (empty && !emptyText) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {title}
      </Text>
      {loading ? (
        <ActivityIndicator color={colors.primary.default} style={styles.loading} />
      ) : empty ? (
        <Text style={styles.muted}>{emptyText}</Text>
      ) : (
        children
      )}
    </View>
  );
}

function RecentSection({ people, onOpen }) {
  if (!people.length) return null;
  return (
    <Section title="Recent searches">
      <View style={styles.list}>
        {people.map((p) => (
          <PlayerCard key={p.id} profile={p} showAction={false} detail="league" onPress={() => onOpen(p)} />
        ))}
      </View>
    </Section>
  );
}

// Upcoming events; when there are none, the latest past ones under "Recent events".
function EventsSection({ data, variant, titleUpcoming = 'Events', onOpen }) {
  return (
    <Section
      title={data?.past ? 'Recent events' : titleUpcoming}
      loading={!data}
      empty={data?.events.length === 0}
      emptyText="No events yet.">
      <View style={styles.list}>
        {(data?.events ?? []).map((e) => (
          <EventCard key={e.id} event={e} variant={variant} onMore={() => onOpen(e)} />
        ))}
      </View>
    </Section>
  );
}

function Results({ tab, results, error, filterNote, onClearFilters, onOpenProfile, onOpenClub, onOpenEvent }) {
  if (error) return <Text style={styles.message}>Couldn&apos;t search right now. Try again.</Text>;
  if (!results) return <ActivityIndicator color={colors.primary.default} style={styles.loading} />;

  const { people = [], clubs = [], events = [] } = results;
  const nothing = !people.length && !clubs.length && !events.length;
  const peopleTitle = tab === 'athletes' ? 'Athletes' : tab === 'professionals' ? 'Professionals' : 'People';

  return (
    <>
      {filterNote ? (
        <View style={styles.filterNote}>
          <Text style={styles.filterNoteText} numberOfLines={2}>
            Filtered by {filterNote}
          </Text>
          <Pressable accessibilityRole="button" hitSlop={8} onPress={onClearFilters}>
            <Text style={styles.clear}>Clear</Text>
          </Pressable>
        </View>
      ) : null}
      {nothing ? <Text style={styles.message}>No results. Try a different search or fewer filters.</Text> : null}
      {people.length ? (
        <Section title={peopleTitle}>
          <View style={styles.list}>
            {people.map((p) => (
              <PlayerCard key={p.id} profile={p} showAction={false} detail="league" onPress={() => onOpenProfile(p)} />
            ))}
          </View>
        </Section>
      ) : null}
      {clubs.length ? (
        <Section title="Clubs">
          <View style={styles.list}>
            {clubs.map((c) => (
              <ClubRow key={c.id} club={c} onPress={() => onOpenClub(c)} />
            ))}
          </View>
        </Section>
      ) : null}
      {events.length ? (
        <Section title="Events">
          <View style={styles.list}>
            {events.map((e) => (
              <EventCard key={e.id} event={e} variant="small" onMore={() => onOpenEvent(e)} />
            ))}
          </View>
        </Section>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.neutral.bg },
  header: { gap: 12, paddingBottom: 16, backgroundColor: colors.white },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 16 },
  searchBar: { flex: 1 },
  dot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.negative.default,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  body: { paddingHorizontal: 16, paddingTop: 16, gap: 24 },
  section: { gap: 12 },
  sectionTitle: { fontFamily: fonts.semibold, fontSize: 16, color: colors.black },
  list: { gap: 8 },
  bleed: { marginHorizontal: -16 },
  cards: { gap: 8, paddingHorizontal: 16 },
  loading: { paddingVertical: 24 },
  muted: { fontFamily: fonts.regular, fontSize: 14, color: colors.neutral[600] },
  message: { paddingVertical: 32, textAlign: 'center', fontFamily: fonts.regular, fontSize: 14, color: colors.neutral[600] },
  filterNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.primary[50],
  },
  filterNoteText: { flex: 1, fontFamily: fonts.medium, fontSize: 14, color: colors.primary[800] },
  clear: { fontFamily: fonts.semibold, fontSize: 14, color: colors.primary.default },
});
