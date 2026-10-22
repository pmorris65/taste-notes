import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import { pickGeofencePlaces } from '../domain/geo';
import type { Coords, Place, Settings } from '../domain/types';
import { hasNotificationPermission, presentArrival, requestNotificationPermission } from '../notifications/arrivals';
import { LAST_ARRIVALS_KEY, SETTINGS_KEY } from '../storage/keys';
import { openRepository } from '../storage/openRepository';

/**
 * Arrival reminders, built on the OS's geofencing: the phone watches a circle
 * around each saved place and wakes the app when you walk into one, even if the
 * app is closed. The app itself doesn't track you in the background.
 *
 * This module is imported from the app entry (index.ts) so the task is defined
 * whenever JS starts, including background launches for a geofence event.
 */

const TASK_NAME = 'taste-notes.arrivals';
/** Smaller circles than this trigger unreliably on phones. */
const RADIUS_M = 100;
/** iOS lets an app watch at most 20 regions at once. */
const MAX_REGIONS = 20;
/** Don't remind about the same place again within this time. */
const COOLDOWN_MS = 3 * 60 * 60 * 1000;

const supported = Platform.OS === 'ios' || Platform.OS === 'android';

interface GeofenceEvent {
  eventType: Location.GeofencingEventType;
  region: Location.LocationRegion;
}

if (supported) {
  TaskManager.defineTask<GeofenceEvent>(TASK_NAME, async ({ data, error }) => {
    if (error || !data) return;
    if (data.eventType !== Location.GeofencingEventType.Enter || !data.region.identifier) return;
    try {
      await handleArrival(data.region.identifier);
    } catch {
      // Nothing useful to do from the background; the next arrival will try again.
    }
  });
}

async function handleArrival(placeId: string): Promise<void> {
  const repo = await openRepository();
  const settings = await repo.getValue<Partial<Settings>>(SETTINGS_KEY);
  if (!settings?.arrivalAlerts) return;
  const places = await repo.loadPlaces();
  const place = places.find((p) => p.id === placeId);
  if (!place?.alerts) return;

  const last = (await repo.getValue<Record<string, number>>(LAST_ARRIVALS_KEY)) ?? {};
  if (Date.now() - (last[placeId] ?? 0) < COOLDOWN_MS) return;
  await repo.setValue(LAST_ARRIVALS_KEY, { ...last, [placeId]: Date.now() });

  await presentArrival(place, await repo.loadNotes());

  // Re-centre the watched places on where the user is now, so the closest
  // ones stay covered as they move around.
  if (place.coords) await startWatching(places, place.coords);
}

async function startWatching(places: Place[], here: Coords | null): Promise<void> {
  const chosen = pickGeofencePlaces(places, here, MAX_REGIONS);
  const started = await Location.hasStartedGeofencingAsync(TASK_NAME);
  const permitted = (await Location.getBackgroundPermissionsAsync()).granted;
  if (!chosen.length || !permitted) {
    if (started) await Location.stopGeofencingAsync(TASK_NAME);
    return;
  }
  await Location.startGeofencingAsync(
    TASK_NAME,
    chosen.map((p) => ({
      identifier: p.id,
      latitude: p.coords!.latitude,
      longitude: p.coords!.longitude,
      radius: RADIUS_M,
      notifyOnEnter: true,
      notifyOnExit: false,
    })),
  );
}

/** Makes the watched places match the saved places and settings. */
export async function syncGeofences(places: Place[], enabled: boolean, here: Coords | null): Promise<void> {
  if (!supported) return;
  if (enabled) {
    await startWatching(places, here);
  } else if (await Location.hasStartedGeofencingAsync(TASK_NAME)) {
    await Location.stopGeofencingAsync(TASK_NAME);
  }
}

export type AlertsPermission =
  | 'ok'
  | 'unsupported'
  | 'location-denied'
  | 'background-denied'
  | 'precise-denied'
  | 'notifications-denied';

/** Geofencing needs precise location: iOS doesn't monitor regions with approximate location. */
function isPrecise(response: Location.LocationPermissionResponse): boolean {
  if (response.ios) return response.ios.accuracy === 'full';
  if (response.android) return response.android.accuracy === 'fine';
  return true;
}

/**
 * Asks for what arrival reminders need, in order: notifications, location
 * while using the app, then location in the background ("Always").
 */
export async function requestAlertsPermission(): Promise<AlertsPermission> {
  if (!supported) return 'unsupported';
  if (!(await requestNotificationPermission())) return 'notifications-denied';
  const foreground = await Location.requestForegroundPermissionsAsync();
  if (!foreground.granted) return 'location-denied';
  if (!isPrecise(foreground)) return 'precise-denied';
  const background = await Location.requestBackgroundPermissionsAsync();
  if (!background.granted) return 'background-denied';
  return 'ok';
}

/** Like requestAlertsPermission, but only checks: it never shows a prompt. */
export async function checkAlertsPermission(): Promise<AlertsPermission> {
  if (!supported) return 'unsupported';
  if (!(await hasNotificationPermission())) return 'notifications-denied';
  const foreground = await Location.getForegroundPermissionsAsync();
  if (!foreground.granted) return 'location-denied';
  if (!isPrecise(foreground)) return 'precise-denied';
  if (!(await Location.getBackgroundPermissionsAsync()).granted) return 'background-denied';
  return 'ok';
}

/** What to tell the user when reminders can't work, and whether Settings can fix it. */
export const ALERTS_PROBLEMS: Record<Exclude<AlertsPermission, 'ok'>, string> = {
  unsupported: 'Arrival reminders only work in the iPhone and Android apps.',
  'notifications-denied': 'Notifications are turned off for Taste Notes. Turn them on in Settings.',
  'location-denied': 'Taste Notes needs access to your location. Allow it in Settings.',
  'precise-denied': 'Turn on Precise Location for Taste Notes in Settings. Reminders can’t tell when you arrive with approximate location.',
  'background-denied':
    'Reminders need location access set to “Always” (iPhone) or “Allow all the time” (Android), so the phone can tell the app when you arrive while it’s closed.',
};
