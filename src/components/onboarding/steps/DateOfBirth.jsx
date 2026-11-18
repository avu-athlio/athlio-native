import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import StepHeader from '@/components/onboarding/StepHeader';
import Drum from '@/components/ui/Drum';

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const NOW = new Date();
const MIN_YEAR = NOW.getFullYear() - 80;
const MAX_YEAR = NOW.getFullYear() - 5;
const YEARS = Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, i) => MIN_YEAR + i);
const DEFAULT_YEAR_IDX = Math.max(0, YEARS.indexOf(2005));

const daysIn = (month0, year) => new Date(year, month0 + 1, 0).getDate();

function parse(value) {
  if (value) {
    const [y, m, d] = value.split('-').map(Number);
    const yi = YEARS.indexOf(y);
    if (d && m >= 1 && m <= 12) return { d: d - 1, m: m - 1, y: yi >= 0 ? yi : DEFAULT_YEAR_IDX };
  }
  return { d: 11, m: 5, y: DEFAULT_YEAR_IDX }; // 12 Jun 2005, as in the design
}

const toValue = (d, m, y) => {
  const year = YEARS[y];
  const day = Math.min(d, daysIn(m, year) - 1) + 1;
  return `${year}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

// value: "YYYY-MM-DD"
export default function DateOfBirth({ value, onChange }) {
  const [sel, setSel] = useState(() => parse(value));

  // Make sure the form always has a date, even if the user doesn't scroll.
  useEffect(() => {
    if (!value) onChange?.(toValue(sel.d, sel.m, sel.y));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dayCount = daysIn(sel.m, YEARS[sel.y]);
  const days = Array.from({ length: dayCount }, (_, i) => i + 1);
  const dayIdx = Math.min(sel.d, dayCount - 1);

  function update(next) {
    const merged = { ...sel, ...next };
    setSel(merged);
    onChange?.(toValue(merged.d, merged.m, merged.y));
  }

  return (
    <View style={styles.root}>
      <StepHeader
        title="Date of birth"
        subtitle="We use this to show you relevant comparisons and opportunities."
      />
      <View style={styles.pickerShell}>
        <View style={styles.picker}>
          <Drum
            key={`day-${dayCount}`}
            items={days}
            index={dayIdx}
            onSelect={(d) => update({ d })}
            format={(d) => String(d).padStart(2, '0')}
            label="Day"
          />
          <Drum items={MONTHS} index={sel.m} onSelect={(m) => update({ m })} label="Month" />
          <Drum items={YEARS} index={sel.y} onSelect={(y) => update({ y })} label="Year" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  pickerShell: { flex: 1, justifyContent: 'center' },
  picker: { flexDirection: 'row', gap: 16 },
});
