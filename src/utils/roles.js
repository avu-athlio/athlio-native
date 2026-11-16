/**
 * Single source of truth for role checks.
 *
 * The web app had three diverging lists (UserContext checked only "scout",
 * Navbar and Topbar each had their own). Everything that is not an athlete is
 * treated as a professional: they get Scout tools instead of Progress and
 * cannot post matches/activities.
 */
export const PROFESSIONAL_ROLES = [
  'scout',
  'coach',
  'manager',
  'agent',
  'professional',
  'organization',
];

export function isProfessional(role) {
  return PROFESSIONAL_ROLES.includes(role);
}

export function isAthlete(role) {
  return !role || role === 'athlete';
}
