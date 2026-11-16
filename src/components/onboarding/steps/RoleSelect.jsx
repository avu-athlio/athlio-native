import { StyleSheet, View } from 'react-native';

import PhotoChoiceCard from '@/components/onboarding/PhotoChoiceCard';
import StepHeader from '@/components/onboarding/StepHeader';

const ROLES = [
  {
    id: 'athlete',
    label: 'Athlete',
    imageBw: require('@/assets/images/role-athlete.jpg'),
    imageColor: require('@/assets/images/expoandedrole_athlete.png'),
    description: 'Showcase your skills, connect with scouts and clubs worldwide.',
  },
  {
    id: 'professional',
    label: 'Professional',
    imageBw: require('@/assets/images/role-professional.jpg'),
    imageColor: require('@/assets/images/expoandedrole_proffessional.png'),
    description: 'Discover talent, manage scouting and build your network.',
  },
];

// "professional" is temporary: the next step picks coach / scout / manager / agent.
const isProfessionalChoice = (role) => role && role !== 'athlete';

export default function RoleSelect({ role, onChange }) {
  const selectedId = role === 'athlete' ? 'athlete' : isProfessionalChoice(role) ? 'professional' : null;

  return (
    <View style={styles.root}>
      <StepHeader title="Choose your role" subtitle="Select how you want to use this app" />
      <View style={styles.cards} accessibilityRole="radiogroup">
        {ROLES.map((r) => (
          <PhotoChoiceCard
            key={r.id}
            {...r}
            selected={selectedId === r.id}
            anySelected={!!selectedId}
            onPress={() => onChange(r.id)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  cards: { flex: 1, flexDirection: 'row', gap: 10, minHeight: 380, maxHeight: 640 },
});
