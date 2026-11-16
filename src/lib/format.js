export function formatMatchDate(raw) {
  if (!raw) return "";
  const d = new Date(raw);
  if (isNaN(d)) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// Post date as on the web feed: "05 Mar".
export function formatPostDate(raw) {
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

// Comment time: "14:05".
export function formatTime(raw) {
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d)) return '';
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}
