import { StyleSheet, View } from 'react-native';

import PhotoChoiceCard from '@/components/onboarding/PhotoChoiceCard';
import StepHeader from '@/components/onboarding/StepHeader';

const PROFESSIONS = [
  {
    id: 'coach',
    label: 'Coach',
    imageBw: require('@/assets/images/coach-bw.png'),
    imageColor: require('@/assets/images/coach-color.png'),
    description: 'Lead athletes and shape winning teams.',
  },
  {
    id: 'scout',
    label: 'Scout',
    imageBw: require('@/assets/images/scout.png'),
    imageColor: require('@/assets/images/scout-color.png'),
    description: 'Discover emerging talent around the world.',
  },
  {
    id: 'manager',
    label: 'Manager',
    imageBw: require('@/assets/images/manager-bw.png'),
    imageColor: require('@/assets/images/manager-color.png'),
    description: 'Oversee club operations and player development.',
  },
  {
    id: 'agent',
    label: 'Agent',
    imageBw: require('@/assets/images/Agent-bw.png'),
    imageColor: require('@/assets/images/Agent-color.png'),
    description: 'Represent athletes and negotiate their careers.',
  },
];

const ROWS = [PROFESSIONS.slice(0, 2), PROFESSIONS.slice(2, 4)];

export default function ProfessionalRole({ value, onChange }) {
  return (
    <View style={styles.root}>
      <StepHeader title="Who are you?" subtitle="Select your role in the football world" />
      <View style={styles.grid} accessibilityRole="radiogroup">
        {ROWS.map((row, i) => {
          const rowHasSelection = row.some((p) => p.id === value);
          return (
            <View key={i} style={styles.row}>
              {row.map((p) => (
                <PhotoChoiceCard
                  key={p.id}
                  {...p}
                  selected={value === p.id}
                  anySelected={rowHasSelection}
                  onPress={() => onChange(p.id)}
                  labelSize={32}
                  labelRight={50}
                />
              ))}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  grid: { flex: 1, gap: 10, minHeight: 340, maxHeight: 560 },
  row: { flex: 1, flexDirection: 'row', gap: 10 },
});
