import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking } from 'react-native';

import { checkAlertsPermission, requestAlertsPermission, type AlertsPermission } from '../location/geofence';
import { useStore } from '../state/store';
import { Body, Button, Card, Screen, Section, SwitchRow } from '../ui/components';

const PROBLEMS: Record<Exclude<AlertsPermission, 'ok'>, string> = {
  unsupported: 'Arrival reminders only work in the iPhone and Android apps.',
  'location-denied': 'Taste Notes needs access to your location. Allow it in Settings.',
  'background-denied':
    'Reminders need location access set to “Always” (iPhone) or “Allow all the time” (Android), so the phone can tell the app when you arrive while it’s closed.',
  'notifications-denied': 'Notifications are turned off for Taste Notes. Turn them on in Settings.',
};

export default function SettingsScreen() {
  const enabled = useStore((s) => s.settings.arrivalAlerts);
  const watched = useStore((s) => s.places.filter((p) => p.alerts && p.coords).length);
  const updateSettings = useStore((s) => s.updateSettings);
  const [problem, setProblem] = useState<AlertsPermission>('ok');

  // Re-check whenever the screen is shown, e.g. after coming back from the phone's Settings.
  useFocusEffect(
    useCallback(() => {
      checkAlertsPermission()
        .then(setProblem)
        .catch(() => {});
    }, []),
  );

  const toggle = async (on: boolean) => {
    if (!on) {
      await updateSettings({ arrivalAlerts: false });
      return;
    }
    const result = await requestAlertsPermission().catch((): AlertsPermission => 'unsupported');
    setProblem(result);
    if (result === 'ok') await updateSettings({ arrivalAlerts: true });
  };

  return (
    <Screen edges={['bottom']}>
      <Section
        title="Arrival reminders"
        footer={`When you arrive at a saved place, you'll get a notification with what you liked and didn't. The phone watches up to 20 of your closest places (${watched} saved with reminders on), and each place reminds you at most once every 3 hours.`}
      >
        <SwitchRow title="Remind me when I arrive" value={enabled} onValueChange={toggle} last />
      </Section>

      {problem !== 'ok' && (enabled || problem !== 'unsupported') ? (
        <Card>
          <Body>{PROBLEMS[problem]}</Body>
          {problem !== 'unsupported' ? (
            <Button title="Open Settings" kind="secondary" onPress={() => Linking.openSettings()} />
          ) : null}
        </Card>
      ) : null}

      <Section title="Privacy">
        <Body style={{ padding: 16 }} muted>
          Your places and notes stay on this phone. Your location is only used on the device, to sort places by
          distance and to notice when you arrive somewhere you&apos;ve saved. It is never sent anywhere.
        </Body>
      </Section>
    </Screen>
  );
}
