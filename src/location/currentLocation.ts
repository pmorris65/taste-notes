import * as Location from 'expo-location';

import type { Coords } from '../domain/types';
import { useStore, type LocationPermission } from '../state/store';

function toPermission(response: Location.LocationPermissionResponse): LocationPermission {
  if (response.granted) return 'granted';
  return response.status === Location.PermissionStatus.UNDETERMINED ? 'undetermined' : 'denied';
}

/** Reads the location permission without prompting and records it in the store. */
export async function refreshLocationPermission(): Promise<LocationPermission> {
  const permission = toPermission(await Location.getForegroundPermissionsAsync());
  useStore.getState().setLocationPermission(permission);
  return permission;
}

/** Prompts for location while using the app, if it hasn't been decided yet. */
export async function requestLocationPermission(): Promise<LocationPermission> {
  const permission = toPermission(await Location.requestForegroundPermissionsAsync());
  useStore.getState().setLocationPermission(permission);
  return permission;
}

/** A fresh, accurate position for saving where a place is. Null if not allowed. */
export async function getCurrentCoords(): Promise<Coords | null> {
  if ((await requestLocationPermission()) !== 'granted') return null;
  const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  useStore.getState().setHere({ latitude: coords.latitude, longitude: coords.longitude });
  return { latitude: coords.latitude, longitude: coords.longitude };
}

/** A short street address for a position, or '' if it can't be looked up. */
export async function describeCoords(coords: Coords): Promise<string> {
  try {
    const [a] = await Location.reverseGeocodeAsync(coords);
    if (!a) return '';
    const street = [a.streetNumber, a.street].filter(Boolean).join(' ');
    return [street || a.name, a.city].filter(Boolean).join(', ');
  } catch {
    return '';
  }
}

/**
 * Finds a typed address on the map with the phone's built-in geocoder (no API
 * key needed). Null if it can't be found. Android needs location permission.
 */
export async function locateAddress(address: string): Promise<Coords | null> {
  const text = address.trim();
  if (!text) return null;
  try {
    const [found] = await Location.geocodeAsync(text);
    return found ? { latitude: found.latitude, longitude: found.longitude } : null;
  } catch {
    return null;
  }
}
