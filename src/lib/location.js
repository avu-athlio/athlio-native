import * as Location from 'expo-location';

const NOMINATIM = 'https://nominatim.openstreetmap.org';
// Nominatim's usage policy requires an identifying User-Agent.
const HEADERS = { 'Accept-Language': 'en', 'User-Agent': 'Athlio/1.0 (mobile app)' };

/** City autocomplete, same source as the web app. */
export async function searchCities(query, { signal } = {}) {
  const url = `${NOMINATIM}/search?q=${encodeURIComponent(query)}&format=json&limit=6&addressdetails=1`;
  const res = await fetch(url, { headers: HEADERS, signal });
  const data = await res.json();
  return data
    .filter((r) => r.address && (r.address.city || r.address.town || r.address.village || r.address.municipality))
    .map((r) => ({
      id: String(r.place_id),
      city: r.address.city || r.address.town || r.address.village || r.address.municipality,
      country: r.address.country || '',
      lat: parseFloat(r.lat),
      lon: parseFloat(r.lon),
    }))
    .filter((r, i, arr) => arr.findIndex((x) => x.city === r.city && x.country === r.country) === i)
    .slice(0, 5);
}

/**
 * Ask for location permission and resolve the device's city.
 * Returns { city, country, lat, lon } or null if denied/unavailable.
 * Pass { ask: false } to only use an already-granted permission.
 */
export async function getCurrentCity({ ask = true } = {}) {
  try {
    const perm = ask
      ? await Location.requestForegroundPermissionsAsync()
      : await Location.getForegroundPermissionsAsync();
    if (!perm.granted) return null;

    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
    const { latitude, longitude } = pos.coords;
    const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (!place) return null;
    return {
      city: place.city || place.subregion || place.district || '',
      country: place.country || '',
      lat: latitude,
      lon: longitude,
    };
  } catch {
    return null;
  }
}
