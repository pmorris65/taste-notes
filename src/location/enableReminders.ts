import { useStore } from '../state/store';
import { confirm } from '../ui/confirm';
import { requestAlertsPermission, type AlertsPermission } from './geofence';

/**
 * Turns arrival reminders on, explaining first what the phone is about to ask
 * for (people refuse "Always" location far less when they know why). Returns
 * the permission result, or null if the user backed out.
 */
export async function enableArrivalReminders(): Promise<AlertsPermission | null> {
  const go = await confirm(
    'Arrival reminders',
    'Your phone will now ask to send notifications and to use your location "Always". On iPhone, choose "Allow While Using App" first, then "Change to Always Allow" when asked.\n\nThe phone only wakes Taste Notes when you arrive at a saved place. You aren’t tracked, and your location never leaves the phone.',
    'Continue',
  );
  if (!go) return null;
  const result = await requestAlertsPermission().catch((): AlertsPermission => 'unsupported');
  if (result === 'ok') await useStore.getState().updateSettings({ arrivalAlerts: true });
  return result;
}
