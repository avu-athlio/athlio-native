import { MapPin } from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';

import ClubPickerSheet from '@/components/compose/ClubPickerSheet';
import { DateField, FieldBox, SelectField } from '@/components/compose/Pickers';
import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/ui/Button';
import PillTabs from '@/components/ui/PillTabs';
import RangeSlider from '@/components/ui/RangeSlider';
import { AGE_RANGE, EMPTY_FILTERS, PRO_ROLES, fetchLeagues } from '@/lib/search';
import { colors, fonts } from '@/theme';
import { FILTER_POSITIONS } from '@/utils/positions';

const GROUPS = [
  { id: 'athletes', label: 'Athletes' },
  { id: 'professionals', label: 'Professional' },
  { id: 'events', label: 'Events' },
];
const capital = (s) => s[0].toUpperCase() + s.slice(1);

/**
 * Figma "Advanced filters". Edits a draft copy; Apply hands back all three
 * groups plus the group that was showing (the screen switches to that tab).
 * Clear resets everything and applies straight away.
 * (The design's professional "Experience" slider is left out: profiles have no
 * experience data to filter on.)
 */
export default function FiltersSheet({ visible, initialGroup, filters, country, onApply, onClose }) {
  const { height } = useWindowDimensions();
  const [group, setGroup] = useState(initialGroup);
  const [draft, setDraft] = useState(filters);
  const [leagues, setLeagues] = useState([]);
  const [teamOpen, setTeamOpen] = useState(false);

  // Fresh draft each time the sheet opens (adjusting state during render).
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setGroup(initialGroup);
      setDraft(filters);
    }
  }

  useEffect(() => {
    if (!visible || leagues.length) return undefined;
    let cancelled = false;
    fetchLeagues()
      .then((l) => !cancelled && setLeagues(l.map((x) => ({ value: x, label: x }))))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [visible, leagues.length]);

  const set = (g, patch) => setDraft((d) => ({ ...d, [g]: { ...d[g], ...patch } }));
  const a = draft.athletes;
  const p = draft.professionals;
  const e = draft.events;

  const togglePosition = (pos) =>
    set('athletes', { positions: a.positions.includes(pos) ? a.positions.filter((x) => x !== pos) : [...a.positions, pos] });
  const toggleRole = (r) => set('professionals', { roles: p.roles.includes(r) ? p.roles.filter((x) => x !== r) : [...p.roles, r] });

  return (
    <BottomSheet
      variant="popover"
      grey
      visible={visible}
      onClose={onClose}
      title="Advanced filters"
      footer={
        <View style={styles.footer}>
          <Button
            size="big"
            type="subtle"
            label="Clear filters"
            onPress={() => onApply(EMPTY_FILTERS, group)}
            style={styles.half}
          />
          <Button size="big" type="primary" label="Apply filters" onPress={() => onApply(draft, group)} style={styles.half} />
        </View>
      }>
      <PillTabs tabs={GROUPS} activeTab={group} onTabChange={setGroup} style={styles.tabs} />
      <ScrollView style={{ maxHeight: height * 0.55 }} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {group === 'athletes' ? (
          <>
            <View style={styles.fields}>
              <SelectField
                label="League or division"
                title="League or division"
                placeholder="Choose league or division"
                value={a.league}
                options={[{ value: '', label: 'Any league' }, ...leagues]}
                onChange={(v) => set('athletes', { league: v || null })}
              />
              <FieldBox label="Team" value={a.team?.name} placeholder="Choose team" onPress={() => setTeamOpen(true)} />
            </View>
            <View style={styles.block}>
              <Text style={styles.heading}>Position</Text>
              <View style={styles.badges}>
                <PositionBadge label="All" active={!a.positions.length} onPress={() => set('athletes', { positions: [] })} />
                {FILTER_POSITIONS.map((pos) => (
                  <PositionBadge key={pos} label={pos} active={a.positions.includes(pos)} onPress={() => togglePosition(pos)} />
                ))}
              </View>
            </View>
            <View>
              <Text style={styles.heading}>Age</Text>
              <RangeSlider value={a.age} onChange={(v) => set('athletes', { age: v })} min={AGE_RANGE[0]} max={AGE_RANGE[1]} label="Age" />
            </View>
          </>
        ) : group === 'professionals' ? (
          <>
            <SelectField
              label="League or division"
              title="League or division"
              placeholder="Choose league or division"
              value={p.league}
              options={[{ value: '', label: 'Any league' }, ...leagues]}
              onChange={(v) => set('professionals', { league: v || null })}
            />
            <View style={styles.block}>
              <Text style={styles.heading}>Profession</Text>
              <View style={styles.chips}>
                {PRO_ROLES.map((r) => {
                  const active = p.roles.includes(r);
                  return (
                    <Pressable
                      key={r}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: active }}
                      onPress={() => toggleRole(r)}
                      style={[styles.chip, active && styles.chipActive]}>
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{capital(r)}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </>
        ) : (
          <>
            <View style={styles.place}>
              <MapPin size={18} color={colors.neutral[700]} />
              <TextInput
                value={e.place}
                onChangeText={(v) => set('events', { place: v })}
                placeholder="Place"
                placeholderTextColor={colors.neutral[700]}
                accessibilityLabel="Place"
                returnKeyType="done"
                style={styles.placeInput}
              />
            </View>
            <View style={styles.block}>
              <Text style={styles.heading}>Date</Text>
              <View style={styles.dates}>
                <DateField
                  label="From"
                  value={e.from}
                  onChange={(v) => set('events', { from: v })}
                  allowFuture
                  yearsBack={1}
                  yearsAhead={2}
                  placeholder="From when"
                  sheetTitle="From"
                  style={styles.cell}
                />
                <View style={styles.dash} />
                <DateField
                  label="To"
                  value={e.to}
                  onChange={(v) => set('events', { to: v })}
                  allowFuture
                  yearsBack={1}
                  yearsAhead={2}
                  placeholder="To when"
                  sheetTitle="To"
                  style={styles.cell}
                />
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <ClubPickerSheet
        visible={teamOpen}
        title="Choose team"
        searchPlaceholder="Search for a team"
        country={country}
        value={a.team}
        allowManual={false}
        onChange={(club) => set('athletes', { team: club })}
        onClose={() => setTeamOpen(false)}
      />
    </BottomSheet>
  );
}

function PositionBadge({ label, active, onPress }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: active }}
      accessibilityLabel={label}
      hitSlop={4}
      onPress={onPress}
      style={[styles.posBadge, active && styles.posBadgeActive]}>
      <Text style={[styles.posText, active && styles.posTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabs: { paddingHorizontal: 0, paddingTop: 0, paddingBottom: 16 },
  body: { gap: 28, paddingTop: 12, paddingBottom: 8 },
  fields: { gap: 20 },
  block: { gap: 12 },
  heading: { fontFamily: fonts.semibold, fontSize: 16, color: colors.black },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  posBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: colors.primary[100] },
  posBadgeActive: { backgroundColor: colors.primary[950] },
  posText: {
    fontFamily: fonts.semiboldItalic,
    fontSize: 14,
    letterSpacing: -0.14,
    textTransform: 'uppercase',
    color: colors.primary[800],
  },
  posTextActive: { color: colors.primary[200] },
  chips: { flexDirection: 'row', gap: 4 },
  chip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  chipActive: { borderColor: colors.primary.default, backgroundColor: colors.primary[50] },
  chipText: { fontFamily: fonts.medium, fontSize: 14, color: colors.black },
  chipTextActive: { color: colors.primary.default },
  place: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.neutral[100],
  },
  placeInput: { flex: 1, height: '100%', fontFamily: fonts.medium, fontSize: 16, color: colors.black },
  dates: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  cell: { flex: 1 },
  dash: { width: 8, height: 1.5, marginHorizontal: 4, borderRadius: 1, backgroundColor: colors.neutral[300] },
  footer: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
});
