import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { DarkTheme, DefaultTheme, router, Stack, ThemeProvider, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { ActivityIndicator, AppState, Platform, StyleSheet, useColorScheme, View } from 'react-native';

import { pickGeofencePlaces } from '../domain/geo';
import { refreshLocationPermission } from '../location/currentLocation';
import { syncGeofences } from '../location/geofence';
import { configureNotifications } from '../notifications/arrivals';
import { useStore } from '../state/store';
import { Body, Button, Screen } from '../ui/components';
import { useColors } from '../ui/theme';

export default function RootLayout() {
  const c = useColors();
  const scheme = useColorScheme();
  const status = useStore((s) => s.status);

  // Without this, native headers (and iOS's glass header buttons) stay light in dark mode.
  const navTheme = useMemo(() => {
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: { ...base.colors, primary: c.accent, background: c.background, card: c.background, text: c.text, border: c.border },
    };
  }, [scheme, c]);

  useEffect(() => {
    configureNotifications();
    useStore.getState().init();
  }, []);

  let content;
  if (status === 'loading') {
    content = (
      <View style={[styles.fill, styles.center]}>
        <ActivityIndicator color={c.muted} />
      </View>
    );
  } else if (status === 'error') {
    content = (
      <Screen title="Something went wrong">
        <Body>Your places couldn&apos;t be loaded. Please try again.</Body>
        <Button title="Try again" kind="secondary" onPress={() => useStore.getState().init()} />
      </Screen>
    );
  } else {
    content = (
      <>
        <Stack
          screenOptions={{
            headerTintColor: c.accent,
            headerStyle: { backgroundColor: c.background },
            headerTitleStyle: { color: c.text },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: c.background },
            headerBackButtonDisplayMode: 'minimal',
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false, title: 'Places' }} />
          <Stack.Screen name="place/new" options={{ title: 'New place', presentation: 'modal' }} />
          <Stack.Screen name="place/[id]" options={{ title: '' }} />
          <Stack.Screen name="edit/[id]" options={{ title: 'Edit place', presentation: 'modal' }} />
          <Stack.Screen name="note/[id]" options={{ title: 'Edit note', presentation: 'modal' }} />
          <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        </Stack>
        <LocationWatcher />
        <GeofenceSync />
        {Platform.OS !== 'web' ? <NotificationTaps /> : null}
      </>
    );
  }

  return (
    <ThemeProvider value={navTheme}>
      <View style={[styles.fill, { backgroundColor: c.background }]}>
        <StatusBar style="auto" />
        {content}
      </View>
    </ThemeProvider>
  );
}

/** Keeps the current position up to date while the app is open, for sorting by distance. */
function LocationWatcher() {
  const permission = useStore((s) => s.locationPermission);

  useEffect(() => {
    refreshLocationPermission().catch(() => {});
    // Permission may have changed in the phone's Settings while we were away.
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshLocationPermission().catch(() => {});
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (permission !== 'granted') return;
    const setHere = useStore.getState().setHere;
    let cancelled = false;
    let watch: Location.LocationSubscription | null = null;

    Location.getLastKnownPositionAsync()
      .then((last) => {
        if (last && !cancelled && !useStore.getState().here) {
          setHere({ latitude: last.coords.latitude, longitude: last.coords.longitude });
        }
      })
      .catch(() => {});
    Location.watchPositionAsync({ accuracy: Location.Accuracy.Balanced, distanceInterval: 25 }, (pos) =>
      setHere({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
    )
      .then((sub) => {
        if (cancelled) sub.remove();
        else watch = sub;
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      watch?.remove();
    };
  }, [permission]);

  return null;
}

/** Keeps the places the phone watches for arrivals in step with saved places and settings. */
function GeofenceSync() {
  const places = useStore((s) => s.places);
  const enabled = useStore((s) => s.settings.arrivalAlerts);
  const here = useStore((s) => s.here);
  const chosen = useMemo(() => (enabled ? pickGeofencePlaces(places, here, 20) : []), [places, here, enabled]);
  // Only re-register when the watched set actually changes, not on every position update.
  const key = chosen.map((p) => `${p.id}@${p.coords?.latitude},${p.coords?.longitude}`).join('|');

  useEffect(() => {
    const timer = setTimeout(() => {
      const { places: latest, here: now } = useStore.getState();
      syncGeofences(latest, enabled, now).catch(() => {});
    }, 500);
    return () => clearTimeout(timer);
  }, [key, enabled]);

  return null;
}

/** The last notification tap acted on. Module-level so it survives the layout remounting. */
let handledNotification: string | null = null;

/** Opens the place when the user taps its arrival reminder. */
function NotificationTaps() {
  const response = Notifications.useLastNotificationResponse();
  // Navigating before the navigator is ready (e.g. on a cold start from the tap) is ignored.
  const navReady = !!useRootNavigationState()?.key;

  useEffect(() => {
    if (!navReady || !response || response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const { identifier, content } = response.notification.request;
    if (handledNotification === identifier) return;
    handledNotification = identifier;
    const placeId = content.data?.placeId;
    if (typeof placeId !== 'string' || !useStore.getState().places.some((p) => p.id === placeId)) return;
    // Close any open form first, so the place doesn't open on top of it.
    if (router.canDismiss()) router.dismissAll();
    router.navigate({ pathname: '/place/[id]', params: { id: placeId } });
  }, [response, navReady]);

  return null;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
});
