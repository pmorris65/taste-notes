import type { Coords, DistanceUnit, Place, SortMode } from './types';

const EARTH_RADIUS_M = 6_371_000;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance in meters. */
export function distanceMeters(a: Coords, b: Coords): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

const METERS_PER_MILE = 1609.344;
const FEET_PER_METER = 3.28084;

/** A short distance in miles (feet when very close) or kilometres (metres when close). */
export function formatDistance(meters: number, units: DistanceUnit = 'mi'): string {
  if (units === 'mi') {
    const miles = meters / METERS_PER_MILE;
    // Under about 0.1 mi, feet are more useful, rounded to 50 ft.
    if (miles < 0.095) return `${Math.max(50, Math.round((meters * FEET_PER_METER) / 50) * 50)} ft`;
    return miles < 10 ? `${miles.toFixed(1)} mi` : `${Math.round(miles)} mi`;
  }
  if (meters < 1000) return `${Math.max(10, Math.round(meters / 10) * 10)} m`;
  const km = meters / 1000;
  return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;
}

export function placeDistance(place: Place, here: Coords | null): number | null {
  return place.coords && here ? distanceMeters(here, place.coords) : null;
}

const byName = (a: Place, b: Place) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
const byRecent = (a: Place, b: Place) => (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0);

/**
 * Sorts places for the list. "Nearby" puts places without a location last
 * (by name), and falls back to most recent when the current location is unknown.
 */
export function sortPlaces(places: Place[], mode: SortMode, here: Coords | null): Place[] {
  const list = [...places];
  if (mode === 'name') return list.sort(byName);
  if (mode === 'recent' || !here) return list.sort(byRecent);
  return list.sort((a, b) => {
    const da = placeDistance(a, here);
    const db = placeDistance(b, here);
    if (da === null && db === null) return byName(a, b);
    if (da === null) return 1;
    if (db === null) return -1;
    return da - db;
  });
}

/**
 * Chooses which places to watch for arrivals. Phones cap how many regions an
 * app can monitor (20 on iOS), so when there are more we keep the closest ones,
 * or the most recently updated when the current location is unknown.
 */
export function pickGeofencePlaces(places: Place[], here: Coords | null, limit: number): Place[] {
  const eligible = places.filter((p) => p.alerts && p.coords);
  return sortPlaces(eligible, 'nearby', here).slice(0, limit);
}
