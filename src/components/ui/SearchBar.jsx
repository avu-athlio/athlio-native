import { MagnifyingGlass, X } from 'phosphor-react-native';
import { Pressable, TextInput, StyleSheet, View } from 'react-native';

import { colors, fonts } from '@/theme';

// Port of the web SearchBar: 44px grey pill with a magnifier and clear button.
export default function SearchBar({ value, onChangeText, placeholder = 'Search', autoFocus = false }) {
  return (
    <View style={styles.bar}>
      <MagnifyingGlass size={18} color={colors.neutral[700]} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.neutral[600]}
        autoFocus={autoFocus}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        clearButtonMode="never"
        accessibilityLabel={placeholder}
        style={styles.input}
      />
      {value ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={8} onPress={() => onChangeText('')}>
          <X size={16} color={colors.neutral[700]} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 44,
    borderRadius: 999,
    backgroundColor: colors.neutral[100],
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: { flex: 1, height: '100%', fontFamily: fonts.medium, fontSize: 16, color: colors.black, padding: 0 },
});
