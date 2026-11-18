// Small formatters for the profile Info and Matches tabs.

export function flagEmoji(code) {
  if (!code || code.length !== 2) return null;
  return String.fromCodePoint(...code.toUpperCase().split('').map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

export function calcAge(birthDate) {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  if (isNaN(birth)) return null;
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

const monthYear = (raw) =>
  raw ? new Date(raw).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : null;

// [start, end] labels for an experience: "From Sep 2021", "to Present".
export function experienceDates(exp) {
  const start = monthYear(exp.start_date);
  if (exp.is_current) return [start ? `From ${start}` : '', 'to Present'];
  const end = monthYear(exp.end_date);
  if (start && end) return [`From ${start}`, `to ${end}`];
  if (start) return [`From ${start}`, ''];
  return ['—', ''];
}

// A season runs July → June. The web labelled matches by calendar year but
// filtered July → June, so spring matches vanished from their own season.
export function seasonStartYear(date) {
  const d = new Date(date);
  if (isNaN(d)) return null;
  return d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1;
}

export const seasonLabel = (startYear) => `${startYear}–${startYear + 1}`;
