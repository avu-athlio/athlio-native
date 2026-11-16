import { useState } from 'react';
import { TextInput as RNTextInput, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius } from '@/theme';

// Multi-line field with a label notched into the top border (web TextArea).
export default function TextArea({ label, value, onChangeText, placeholder, minHeight = 96, ...rest }) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      <RNTextInput
        multiline
        textAlignVertical="top"
        value={value ?? ''}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.neutral[500]}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityLabel={label}
        style={[styles.field, { minHeight }, focused && styles.focused]}
        {...rest}
      />
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 8 },
  field: {
    paddingHorizontal: 12,
    paddingTop: 13,
    paddingBottom: 13,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    backgroundColor: colors.white,
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.black,
  },
  focused: { borderColor: colors.primary.default },
  label: {
    position: 'absolute',
    top: 0,
    left: 8,
    paddingHorizontal: 2,
    backgroundColor: colors.white,
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 16,
    color: colors.black,
  },
});
