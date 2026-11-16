import 'expo-sqlite/localStorage/install';

// Returning users skip the intro and land straight on the auth screen.
const KEY = 'introSeen';

export function hasSeenIntro() {
  return localStorage.getItem(KEY) === 'true';
}

export function markIntroSeen() {
  localStorage.setItem(KEY, 'true');
}
