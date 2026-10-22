import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking, View } from 'react-native';

import { enableArrivalReminders } from '../location/enableReminders';
import { ALERTS_PROBLEMS, checkAlertsPermission, type AlertsPermission } from '../location/geofence';
import { useStore } from '../state/store';
import { Body, Button, Card, Label, Screen, Section, Segmented, SwitchRow } from '../ui/components';
import { ThemePicker } from '../ui/ThemePicker';
import { spacing } from '../ui/theme';

export default function SettingsScreen() {
  const enabled = useStore((s) => s.settings.arrivalAlerts);
  const theme = useStore((s) => s.settings.theme);
  const units = useStore((s) => s.settings.units);
  const watched = useStore((s) => s.places.filter((p) => p.alerts && p.coords).length);
  const updateSettings = useStore((s) => s.updateSettings);
  const [problem, setProblem] = useState<AlertsPermission>('ok');
  // The user tried to turn reminders on but a permission was missing; finish once it's granted.
  const [pending, setPending] = useState(false);

  const recheck = useCallback(() => {
    checkAlertsPermission()
      .then(async (result) => {
        setProblem(result);
        if (result === 'ok' && pending) {
          setPending(false);
          await updateSettings({ arrivalAlerts: true });
        }
      })
      .catch(() => {});
  }, [pending, updateSettings]);

  // Re-check when the screen is shown, and when coming back from the phone's Settings app.
  useFocusEffect(recheck);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') recheck();
    });
    return () => sub.remove();
  }, [recheck]);

  const toggle = async (on: boolean) => {
    if (!on) {
      setPending(false);
      await updateSettings({ arrivalAlerts: false });
      return;
    }
    const result = await enableArrivalReminders();
    if (result === null) return;
    setProblem(result);
    setPending(result !== 'ok' && result !== 'unsupported');
  };

  const showProblem = problem !== 'ok' && (enabled || pending || problem === 'unsupported');

  return (
    <Screen edges={['bottom']}>
      <Section
        title="Arrival reminders"
        footer={`When you arrive at a saved place, you'll get a notification with what you liked and didn't. The phone watches up to 20 of your closest places (${watched} saved with reminders on), and each place reminds you at most once every 3 hours.`}
      >
        <SwitchRow title="Remind me when I arrive" value={enabled} onValueChange={toggle} last />
      </Section>

      {showProblem ? (
        <Card>
          <Body>{ALERTS_PROBLEMS[problem as Exclude<AlertsPermission, 'ok'>]}</Body>
          {problem !== 'unsupported' ? (
            <Button title="Open Settings" kind="secondary" onPress={() => Linking.openSettings()} />
          ) : null}
        </Card>
      ) : null}

      <View style={{ gap: spacing.sm }}>
        <Label header style={{ marginLeft: spacing.xs }}>
          Distances
        </Label>
        <Segmented
          label="Distance units"
          options={[
            { value: 'mi', label: 'Miles' },
            { value: 'km', label: 'Kilometres' },
          ]}
          value={units}
          onChange={(u) => updateSettings({ units: u })}
        />
      </View>

      <View style={{ gap: spacing.sm }}>
        <Label header style={{ marginLeft: spacing.xs }}>
          Colour theme
        </Label>
        <ThemePicker value={theme} onChange={(t) => updateSettings({ theme: t })} />
      </View>

      <Section
        title="Privacy"
        footer="When you search Google Maps for a place, what you type and your approximate location (to show nearby results first) are sent to Google."
      >
        <Body style={{ padding: 16 }}>
          Your places and notes stay on this phone. Your location is used on the device to sort places by distance and
          to notice when you arrive somewhere you&apos;ve saved.
        </Body>
      </Section>
    </Screen>
  );
}
