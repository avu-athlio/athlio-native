// Tiny app-wide event bus. Replaces the web's `document` CustomEvents
// (e.g. "composer:posted"), which don't exist in React Native.
const listeners = new Map();

export function on(event, fn) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(fn);
  return () => listeners.get(event)?.delete(fn);
}

export function emit(event, payload) {
  listeners.get(event)?.forEach((fn) => fn(payload));
}

// Composers call emit(POST_CREATED) after publishing; the Home feed refreshes.
export const POST_CREATED = 'post:created';
