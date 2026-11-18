import { Image } from 'expo-image';
import { CheckCircle, Plus } from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  TextInput as RNTextInput,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/ui/Button';
import SearchBar from '@/components/ui/SearchBar';
import { searchClubs } from '@/lib/posts';
import { colors, fonts } from '@/theme';

/**
 * Port of AddMatch's "Pick your team" / "Pick opponent team" sheets.
 * Clubs from my country until you type 2+ letters, then a name search.
 * "Add … manually" opens an inline field (the web used window.prompt).
 * value / onChange: { id?, name, logo_url? } | null.
 */
export default function ClubPickerSheet({
  visible,
  title,
  manualLabel,
  searchPlaceholder,
  country,
  value,
  onChange,
  onClose,
  allowManual = true,
}) {
  const { height } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [manual, setManual] = useState(null); // null | typed name
  const [picked, setPicked] = useState(value);

  // Reset the draft each time the sheet opens (adjusting state during render).
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setPicked(value);
      setQuery('');
      setManual(null);
    }
  }

  useEffect(() => {
    if (!visible) return undefined;
    let cancelled = false;
    const t = setTimeout(
      () => {
        setLoading(true);
        searchClubs(query, country)
          .then((rows) => !cancelled && setClubs(rows))
          .catch(() => !cancelled && setClubs([]))
          .finally(() => !cancelled && setLoading(false));
      },
      query ? 250 : 0,
    );
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [visible, query, country]);

  const choose = () => {
    if (manual != null) {
      const name = manual.trim();
      if (!name) return;
      onChange({ name });
    } else if (picked) {
      onChange(picked);
    }
    onClose();
  };

  const canChoose = manual != null ? !!manual.trim() : !!picked;

  return (
    <BottomSheet
      variant="popover"
      visible={visible}
      onClose={onClose}
      title={title}
      footer={<Button size="big" type="primary" label="Choose" disabled={!canChoose} onPress={choose} />}>
      <View style={{ height: height * 0.5 }}>
        {manual != null ? (
          <View style={styles.manual}>
            <Text style={styles.label}>{manualLabel}</Text>
            <RNTextInput
              value={manual}
              onChangeText={setManual}
              placeholder="Team name"
              placeholderTextColor={colors.neutral[500]}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={choose}
              style={styles.manualInput}
            />
            <Pressable accessibilityRole="button" onPress={() => setManual(null)} hitSlop={8}>
              <Text style={styles.link}>Back to club list</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <SearchBar value={query} onChangeText={setQuery} placeholder={searchPlaceholder} />
            <FlatList
              data={clubs}
              keyExtractor={(c) => String(c.id)}
              keyboardShouldPersistTaps="handled"
              style={styles.list}
              contentContainerStyle={styles.listContent}
              ListHeaderComponent={
                <Text style={styles.label}>{query.trim().length >= 2 ? 'Results' : 'Recommended clubs'}</Text>
              }
              renderItem={({ item }) => (
                <ClubRow club={item} selected={picked?.id === item.id} onPress={() => setPicked(item)} />
              )}
              ListEmptyComponent={
                loading ? (
                  <ActivityIndicator style={styles.loading} color={colors.primary.default} />
                ) : (
                  <Text style={styles.empty}>No clubs found.</Text>
                )
              }
              ListFooterComponent={
                allowManual ? (
                <Pressable accessibilityRole="button" onPress={() => setManual(query)} style={styles.addManual}>
                  <View style={styles.addIcon}>
                    <Plus size={24} color={colors.primary.default} />
                  </View>
                  <Text style={styles.addText}>{manualLabel}</Text>
                </Pressable>
                ) : null
              }
            />
          </>
        )}
      </View>
    </BottomSheet>
  );
}

function ClubRow({ club, selected, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.row, selected && styles.rowSelected]}>
      <View style={styles.logoWrap}>
        {club.logo_url ? (
          <Image source={{ uri: club.logo_url }} style={styles.logo} contentFit="contain" />
        ) : (
          <Text style={styles.initial}>{(club.name || '?')[0]}</Text>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {club.name}
        </Text>
        {club.league ? (
          <Text style={styles.league} numberOfLines={1}>
            {club.league}
          </Text>
        ) : null}
      </View>
      {selected ? <CheckCircle size={24} weight="fill" color={colors.primary.default} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, marginTop: 12 },
  listContent: { gap: 8 },
  label: { fontFamily: fonts.semibold, fontSize: 16, color: colors.black, marginBottom: 4 },
  loading: { paddingVertical: 24 },
  empty: { fontFamily: fonts.regular, fontSize: 14, color: colors.neutral[600], paddingVertical: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.white,
  },
  rowSelected: { borderColor: colors.primary.default, backgroundColor: colors.primary[50] },
  logoWrap: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  logo: { width: 32, height: 32 },
  initial: { fontFamily: fonts.semibold, fontSize: 16, color: colors.neutral[600] },
  info: { flex: 1, minWidth: 0 },
  name: { fontFamily: fonts.medium, fontSize: 14, color: colors.black },
  league: { fontFamily: fonts.medium, fontSize: 12, color: colors.neutral[700] },
  addManual: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 8,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary[200],
    backgroundColor: colors.white,
  },
  addIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[100],
  },
  addText: { fontFamily: fonts.medium, fontSize: 14, color: colors.black },
  manual: { gap: 12, paddingTop: 4 },
  manualInput: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.primary.default,
    paddingHorizontal: 12,
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.black,
    backgroundColor: colors.white,
  },
  link: { fontFamily: fonts.semibold, fontSize: 14, color: colors.primary.default },
});
