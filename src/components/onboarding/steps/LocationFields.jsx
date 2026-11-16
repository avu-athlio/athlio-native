import { MagnifyingGlass, MapPin, X } from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';

import Globe from '@/components/onboarding/Globe';
import StepHeader from '@/components/onboarding/StepHeader';
import { searchCities } from '@/lib/location';
import { colors, fonts, radius } from '@/theme';

// City search + globe. "Give access to location" lives in the wizard's bottom bar.
export default function LocationFields({ country, city, coords, onChange }) {
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState('');
  // Results plus the search term they belong to, so "searching" can be derived.
  const [found, setFound] = useState({ term: '', items: [] });

  const term = query.trim();
  const active = term.length >= 2;
  const searching = active && found.term !== term;
  const suggestions = active && found.term === term ? found.items : [];

  const hasSelection = !!(city && country);
  const globeSize = Math.min(Math.round(width * 0.66), 300);

  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const items = await searchCities(term, { signal: controller.signal });
        setFound({ term, items });
      } catch {
        // Offline or aborted: show no suggestions for this term.
        if (!controller.signal.aborted) setFound({ term, items: [] });
      }
    }, 400);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term, active]);

  function pick(s) {
    setQuery('');
    onChange({ city: s.city, country: s.country, coords: { lat: s.lat, lon: s.lon } });
  }

  return (
    <View style={styles.root}>
      <StepHeader
        title="Your Location"
        subtitle="Get recommended nearby clubs, local opportunities and regional leaderboards."
      />

      {hasSelection ? (
        <View style={styles.selectedRow}>
          <View style={styles.chip}>
            <MapPin size={15} weight="fill" color={colors.primary.default} />
            <Text style={styles.chipText}>
              {city}, {country}
            </Text>
          </View>
          <Pressable
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Clear location"
            onPress={() => onChange({ city: '', country: '', coords: null })}>
            <X size={18} weight="bold" color={colors.neutral[700]} />
          </Pressable>
        </View>
      ) : (
        <View style={styles.searchArea}>
          <View style={styles.searchBar}>
            <MagnifyingGlass size={18} color={colors.neutral[700]} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search for a city or town..."
              placeholderTextColor={colors.neutral[700]}
              autoCorrect={false}
              returnKeyType="search"
              accessibilityLabel="Search for a city or town"
              style={styles.searchInput}
            />
            {searching ? <ActivityIndicator size="small" color={colors.neutral[700]} /> : null}
            {query && !searching ? (
              <Pressable hitSlop={8} onPress={() => setQuery('')} accessibilityLabel="Clear search">
                <X size={16} weight="bold" color={colors.neutral[700]} />
              </Pressable>
            ) : null}
          </View>

          {suggestions.length > 0 ? (
            <View style={styles.dropdown}>
              {suggestions.map((s) => (
                <Pressable
                  key={s.id}
                  onPress={() => pick(s)}
                  style={({ pressed }) => [styles.suggestion, pressed && styles.suggestionPressed]}>
                  <MapPin size={16} weight="fill" color={colors.primary.default} />
                  <View>
                    <Text style={styles.suggestionCity}>{s.city}</Text>
                    <Text style={styles.suggestionCountry}>{s.country}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      )}

      <View style={styles.visual} pointerEvents="none">
        <View style={[styles.glow, { width: globeSize * 1.07, height: globeSize * 1.07 }]} />
        {[0, 0.9, 1.8].map((delay) => (
          <Animated.View
            key={delay}
            style={[
              styles.ring,
              {
                width: globeSize * 1.07,
                height: globeSize * 1.07,
                borderRadius: globeSize,
                animationDelay: `${delay}s`,
              },
            ]}
          />
        ))}
        <Globe pinCoords={coords} size={globeSize} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  selectedRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.primary[50],
  },
  chipText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.primary[800] },
  searchArea: { zIndex: 10 },
  searchBar: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
    backgroundColor: colors.neutral[100],
  },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 16, color: colors.black },
  dropdown: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    paddingVertical: 4,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    boxShadow: '0 8px 24px rgba(21,22,34,0.12)',
  },
  suggestion: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10 },
  suggestionPressed: { backgroundColor: colors.neutral[100] },
  suggestionCity: { fontFamily: fonts.semibold, fontSize: 15, color: colors.black },
  suggestionCountry: { fontFamily: fonts.regular, fontSize: 13, color: colors.neutral[700] },
  visual: { flex: 1, minHeight: 260, alignItems: 'center', justifyContent: 'center' },
  glow: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(64,81,253,0.07)',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: 'rgba(64,81,253,0.45)',
    animationName: {
      from: { transform: [{ scale: 0.85 }], opacity: 0.7 },
      to: { transform: [{ scale: 1.9 }], opacity: 0 },
    },
    animationDuration: '2.8s',
    animationTimingFunction: 'ease-out',
    animationIterationCount: 'infinite',
  },
});
