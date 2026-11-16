import { CaretDown, X } from 'phosphor-react-native';
import { forwardRef, useRef, useState } from 'react';
import { Pressable, TextInput as RNTextInput, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius } from '@/theme';

/**
 * Floating-label text field, ported from the web TextInput.
 * Pass `readOnly` + `onPress` to use it as a tappable select field.
 * Any other props (keyboardType, secureTextEntry, autoComplete…) go to the native input.
 */
const TextInput = forwardRef(function TextInput(
  { label, value, onChangeText, readOnly = false, onPress, error, style, ...inputProps },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const innerRef = useRef(null);
  const inputRef = ref ?? innerRef;

  const filled = value !== undefined && value !== null && String(value) !== '';
  const floated = focused || filled;
  const required = typeof label === 'string' && /\*$/.test(label);
  const cleanLabel = typeof label === 'string' ? label.replace(/ ?\*$/, '') : label;

  const field = (
    <View
      style={[
        styles.wrapper,
        floated && styles.wrapperTransparent,
        focused && styles.focused,
        filled && !focused && styles.filled,
        error && styles.errored,
        style,
      ]}>
      <RNTextInput
        ref={inputRef}
        value={value == null ? '' : String(value)}
        onChangeText={onChangeText}
        editable={!readOnly}
        pointerEvents={readOnly ? 'none' : 'auto'}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholderTextColor="transparent"
        style={styles.input}
        accessibilityLabel={cleanLabel}
        {...inputProps}
      />

      {cleanLabel ? (
        <Text
          pointerEvents="none"
          style={[styles.label, floated ? styles.labelFloated : styles.labelResting]}>
          {floated ? cleanLabel.toUpperCase() : cleanLabel}
          {required ? <Text style={styles.required}>*</Text> : null}
        </Text>
      ) : null}

      {readOnly ? (
        <View pointerEvents="none" style={styles.trailing}>
          <CaretDown size={18} color={colors.neutral[700]} />
        </View>
      ) : filled && !focused ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={cleanLabel ? `Clear ${cleanLabel}` : 'Clear input'}
          hitSlop={8}
          onPress={() => {
            onChangeText?.('');
            inputRef.current?.focus();
          }}
          style={styles.trailing}>
          <X size={18} color={colors.neutral[700]} />
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <View>
      {readOnly ? (
        <Pressable accessibilityRole="button" onPress={onPress}>
          {field}
        </Pressable>
      ) : (
        field
      )}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
});

export default TextInput;

const styles = StyleSheet.create({
  wrapper: {
    height: 56,
    borderRadius: radius.sm,
    backgroundColor: colors.neutral[100],
    borderWidth: 1.5,
    borderColor: 'transparent',
    justifyContent: 'center',
  },
  wrapperTransparent: { backgroundColor: 'transparent' },
  focused: { borderColor: colors.neutral[700] },
  filled: { borderColor: colors.neutral[300] },
  errored: { borderColor: colors.negative.default },
  input: {
    height: '100%',
    paddingTop: 18,
    paddingLeft: 14,
    paddingRight: 44,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.neutral[900],
  },
  label: { position: 'absolute', left: 14 },
  labelResting: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.neutral[900],
  },
  labelFloated: {
    top: 8,
    fontFamily: fonts.semibold,
    fontSize: 10,
    letterSpacing: 0.4,
    color: colors.neutral[600],
  },
  required: { color: colors.primary[500] },
  trailing: {
    position: 'absolute',
    right: 8,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    marginTop: 4,
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.negative.default,
  },
});
