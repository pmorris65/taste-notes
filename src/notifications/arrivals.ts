import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { arrivalMessage } from '../domain/summary';
import type { Note, Place } from '../domain/types';

/** Local notifications only: they're shown by the device and never go through a server. */

const CHANNEL_ID = 'arrivals';
const supported = Platform.OS === 'ios' || Platform.OS === 'android';

async function ensureChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Arrival reminders',
    importance: Notifications.AndroidImportance.HIGH,
  });
}

export function configureNotifications(): void {
  if (!supported) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  ensureChannel().catch(() => {});
}

export async function hasNotificationPermission(): Promise<boolean> {
  if (!supported) return false;
  return (await Notifications.getPermissionsAsync()).granted;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!supported) return false;
  if (await hasNotificationPermission()) return true;
  return (await Notifications.requestPermissionsAsync()).granted;
}

/** Shows the "you're at …" reminder right away. Tapping it opens the place. */
export async function presentArrival(place: Place, notes: Note[]): Promise<void> {
  if (!supported) return;
  await ensureChannel();
  const { title, body } = arrivalMessage(place, notes);
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data: { placeId: place.id } },
    trigger: Platform.OS === 'android' ? { channelId: CHANNEL_ID } : null,
  });
}
