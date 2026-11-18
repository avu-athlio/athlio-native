import { LinearGradient } from 'expo-linear-gradient';
import { CalendarBlank, CaretDown, CheckCircle, Minus, Plus } from 'phosphor-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/ui/Button';
import Drum from '@/components/ui/Drum';
import { colors, fonts } from '@/theme';

// Form pieces for the compose screens, matching the Figma "Input" component:
// white 44px box with the label notched into the top border. Selects open a
// sheet (list, number stepper or wheel) since there's no native <select>.

// Label sitting on a field's top border. The gradient blends from the page
// background (above the border) into the white field (below it).
export function NotchLabel({ label, required, color = colors.neutral[600], under = colors.neutral.bg }) {
  return (
    <LinearGradient pointerEvents="none" colors={[under, colors.white]} style={styles.notch}>
      <Text style={[styles.notchText, { color }]}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
    </LinearGradient>
  );
}

// Tappable read-only field. `value` empty → shows `placeholder`.
export function FieldBox({ label, required, value, placeholder, icon: Icon = CaretDown, onPress, error, style }) {
  const empty = value == null || value === '';
  return (
    <View style={style}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}${required ? ', required' : ''}: ${empty ? placeholder ?? 'not set' : value}`}
        onPress={onPress}
        style={({ pressed }) => [styles.field, error && styles.fieldError, pressed && styles.fieldPressed]}>
        <Text style={styles.fieldValue} numberOfLines={1}>
          {empty ? placeholder : value}
        </Text>
        <Icon size={18} color={colors.black} />
      </Pressable>
      {label ? <NotchLabel label={label} required={required} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

// Row of pill chips; `options` = [{ value, label }].
export function ChipGroup({ options, value, onChange, error }) {
  return (
    <View>
      <View style={styles.chips} accessibilityRole="radiogroup">
        {options.map((o) => {
          const active = o.value === value;
          return (
            <Pressable
              key={o.value}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              onPress={() => onChange(o.value)}
              style={[styles.chip, active && styles.chipActive]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

/** Field → "handle" sheet listing `options` ([{ value, label }]). */
export function SelectField({ label, required, title, value, options, onChange, placeholder, error, style }) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  return (
    <View style={style}>
      <FieldBox
        label={label}
        required={required}
        value={current?.label}
        placeholder={placeholder}
        onPress={() => setOpen(true)}
        error={error}
      />
      <OptionSheet
        visible={open}
        title={title ?? label}
        options={options}
        value={value}
        onSelect={(v) => {
          onChange(v);
          setOpen(false);
        }}
        onClose={() => setOpen(false)}
      />
    </View>
  );
}

export function OptionSheet({ visible, title, options, value, onSelect, onClose }) {
  const { height } = useWindowDimensions();
  return (
    <BottomSheet variant="handle" visible={visible} onClose={onClose} title={title}>
      <ScrollView style={{ maxHeight: height * 0.55 }} contentContainerStyle={styles.options}>
        {options.map((o) => {
          const selected = o.value === value;
          return (
            <Pressable
              key={o.value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onSelect(o.value)}
              style={({ pressed }) => [styles.option, (selected || pressed) && styles.optionSelected]}>
              <Text style={styles.optionText}>{o.label}</Text>
              {selected ? <CheckCircle size={24} color={colors.primary.default} /> : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </BottomSheet>
  );
}

/** Field → sheet with a −/+ number stepper and Save (scores, goals, assists). */
export function StepperField({ label, required, title, value, onChange, placeholder, min = 0, max = 20, error, style }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value ?? min);
  return (
    <View style={style}>
      <FieldBox
        label={label}
        required={required}
        value={value == null ? '' : String(value)}
        placeholder={placeholder}
        onPress={() => {
          setDraft(value ?? min);
          setOpen(true);
        }}
        error={error}
      />
      <BottomSheet
        variant="handle"
        visible={open}
        onClose={() => setOpen(false)}
        title={title}
        footer={
          <Button
            size="big"
            type="primary"
            label="Save"
            onPress={() => {
              onChange(draft);
              setOpen(false);
            }}
          />
        }>
        <NumberStepper value={draft} onChange={setDraft} min={min} max={max} label={title} />
      </BottomSheet>
    </View>
  );
}

function NumberStepper({ value, onChange, min, max, label }) {
  const canDec = value > min;
  const canInc = value < max;
  const step = (d) => onChange(Math.max(min, Math.min(max, value + d)));
  return (
    <View
      style={styles.stepper}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min, max, now: value }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => step(e.nativeEvent.actionName === 'increment' ? 1 : -1)}>
      <Pressable onPress={() => step(-1)} disabled={!canDec} hitSlop={12} importantForAccessibility="no">
        <Minus size={24} color={canDec ? colors.primary.default : colors.neutral[300]} />
      </Pressable>
      <Text style={styles.stepperValue}>{value}</Text>
      <Pressable onPress={() => step(1)} disabled={!canInc} hitSlop={12} importantForAccessibility="no">
        <Plus size={24} color={canInc ? colors.primary.default : colors.neutral[300]} />
      </Pressable>
    </View>
  );
}

/** Field → sheet with one plain scroll wheel and Choose (minutes played). */
export function WheelField({ label, required, title, value, items, format = String, onChange, error, style }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(Math.max(0, items.indexOf(value)));
  return (
    <View style={style}>
      <FieldBox
        label={label}
        required={required}
        value={value == null ? '' : format(value)}
        onPress={() => {
          setDraft(Math.max(0, items.indexOf(value)));
          setOpen(true);
        }}
        error={error}
      />
      <BottomSheet
        variant="handle"
        visible={open}
        onClose={() => setOpen(false)}
        title={title ?? label}
        footer={
          <View style={styles.wheelFooter}>
            <Button
              size="big"
              type="primary"
              label="Choose"
              onPress={() => {
                onChange(items[draft]);
                setOpen(false);
              }}
            />
          </View>
        }>
        <View style={styles.wheel}>
          <Drum key={`w-${open}`} variant="plain" items={items} index={draft} onSelect={setDraft} format={format} label={title ?? label} />
        </View>
      </BottomSheet>
    </View>
  );
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const daysIn = (m0, y) => new Date(y, m0 + 1, 0).getDate();
const pad2 = (n) => String(n).padStart(2, '0');
const toValue = (y, m0, d) => `${y}-${pad2(m0 + 1)}-${pad2(Math.min(d, daysIn(m0, y)))}`;

/**
 * Date field → sheet with day / month / year wheels. value: "YYYY-MM-DD".
 * Matches can't be in the future, so years end at this year.
 */
export function DateField({ label, required, value, onChange, error, yearsBack = 10 }) {
  const [open, setOpen] = useState(false);
  const now = new Date();
  const years = Array.from({ length: yearsBack + 1 }, (_, i) => now.getFullYear() - yearsBack + i);
  const init = value ? value.split('-').map(Number) : [now.getFullYear(), now.getMonth() + 1, now.getDate()];
  const [sel, setSel] = useState({ y: init[0], m: init[1] - 1, d: init[2] });

  const dayCount = daysIn(sel.m, sel.y);
  const days = Array.from({ length: dayCount }, (_, i) => i + 1);
  const display = value ? value.split('-').reverse().join('/') : '';
  const picked = toValue(sel.y, sel.m, sel.d);
  const future = new Date(`${picked}T00:00:00`) > now;

  return (
    <View>
      <FieldBox
        label={label}
        required={required}
        value={display}
        placeholder="dd/mm/yyyy"
        icon={CalendarBlank}
        onPress={() => setOpen(true)}
        error={error}
      />
      <BottomSheet visible={open} onClose={() => setOpen(false)} title="Date of game">
        <View style={styles.wheels}>
          <Drum
            key={`d-${dayCount}-${open}`}
            items={days}
            index={Math.min(sel.d, dayCount) - 1}
            onSelect={(i) => setSel((s) => ({ ...s, d: i + 1 }))}
            format={pad2}
            label="Day"
          />
          <Drum key={`m-${open}`} items={MONTHS} index={sel.m} onSelect={(m) => setSel((s) => ({ ...s, m }))} label="Month" />
          <Drum
            key={`y-${open}`}
            items={years}
            index={Math.max(0, years.indexOf(sel.y))}
            onSelect={(i) => setSel((s) => ({ ...s, y: years[i] }))}
            label="Year"
          />
        </View>
        {future ? <Text style={styles.futureNote}>That date is in the future.</Text> : null}
        <Button
          size="big"
          type="primary"
          label="Choose"
          disabled={future}
          onPress={() => {
            onChange(picked);
            setOpen(false);
          }}
          style={styles.sheetButton}
        />
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  notch: { position: 'absolute', top: -8, left: 8, paddingHorizontal: 2 },
  notchText: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16, textTransform: 'uppercase' },
  required: { color: colors.primary.default },

  field: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    backgroundColor: colors.white,
  },
  fieldError: { borderColor: colors.negative.default },
  fieldPressed: { borderColor: colors.neutral[400] },
  fieldValue: { flex: 1, fontFamily: fonts.medium, fontSize: 16, color: colors.black },
  error: { fontFamily: fonts.medium, fontSize: 12, color: colors.negative.default, marginTop: 4 },

  chips: { flexDirection: 'row', gap: 8 },
  chip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: { borderColor: colors.primary.default, backgroundColor: colors.primary[50] },
  chipText: { fontFamily: fonts.medium, fontSize: 14, color: colors.black },
  chipTextActive: { color: colors.primary.default },

  options: { gap: 4 },
  option: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.white,
  },
  optionSelected: { backgroundColor: colors.neutral.bg },
  optionText: { fontFamily: fonts.medium, fontSize: 16, color: colors.black },

  stepper: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 80,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.white,
  },
  stepperValue: { minWidth: 28, textAlign: 'center', fontFamily: fonts.condensedBold, fontSize: 44, color: colors.black },

  wheel: { flexDirection: 'row' },
  wheelFooter: { paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.neutral[200] },

  wheels: { flexDirection: 'row', gap: 16 },
  futureNote: { fontFamily: fonts.regular, fontSize: 12, color: colors.negative.default, textAlign: 'center', marginTop: 8 },
  sheetButton: { marginTop: 16 },
});
