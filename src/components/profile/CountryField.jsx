import { CheckCircle } from 'phosphor-react-native';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { FieldBox } from '@/components/compose/Pickers';
import BottomSheet from '@/components/ui/BottomSheet';
import SearchBar from '@/components/ui/SearchBar';
import { flagEmoji } from '@/lib/profile-format';
import { COUNTRIES } from '@/utils/countries';
import { colors, fonts } from '@/theme';

/**
 * Country picker field: tap → searchable list with flags.
 * `value` is the ISO code; onChange gets { code, name } (or null to clear).
 */
export default function CountryField({ label, required, value, onChange, placeholder = 'Choose country', title, style }) {
  const { height } = useWindowDimensions();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const current = COUNTRIES.find((c) => c.code === value);
  const term = query.trim().toLowerCase();
  const list = term ? COUNTRIES.filter((c) => c.name.toLowerCase().includes(term)) : COUNTRIES;

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  return (
    <View style={style}>
      <FieldBox
        label={label}
        required={required}
        value={current ? `${flagEmoji(current.code) ?? ''} ${current.name}`.trim() : ''}
        placeholder={placeholder}
        onPress={() => setOpen(true)}
      />
      <BottomSheet variant="handle" visible={open} onClose={close} title={title ?? label}>
        <View style={styles.search}>
          <SearchBar value={query} onChangeText={setQuery} placeholder="Search country" />
        </View>
        <FlatList
          data={list}
          keyExtractor={(c) => c.code}
          style={{ maxHeight: height * 0.5 }}
          keyboardShouldPersistTaps="handled"
          initialNumToRender={20}
          ListHeaderComponent={
            value && !term ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  onChange(null);
                  close();
                }}
                style={styles.option}>
                <Text style={styles.clear}>Clear</Text>
              </Pressable>
            ) : null
          }
          renderItem={({ item }) => {
            const selected = item.code === value;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => {
                  onChange(item);
                  close();
                }}
                style={({ pressed }) => [styles.option, (selected || pressed) && styles.optionOn]}>
                <Text style={styles.flag}>{flagEmoji(item.code)}</Text>
                <Text style={styles.name}>{item.name}</Text>
                {selected ? <CheckCircle size={22} color={colors.primary.default} /> : null}
              </Pressable>
            );
          }}
          ListEmptyComponent={<Text style={styles.empty}>No countries found.</Text>}
        />
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  search: { marginBottom: 8 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8 },
  optionOn: { backgroundColor: colors.neutral[100] },
  flag: { fontSize: 20 },
  name: { flex: 1, fontFamily: fonts.medium, fontSize: 16, color: colors.black },
  clear: { fontFamily: fonts.semibold, fontSize: 14, color: colors.negative.default },
  empty: { padding: 16, textAlign: 'center', fontFamily: fonts.regular, fontSize: 14, color: colors.neutral[600] },
});
