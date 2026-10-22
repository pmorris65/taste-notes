import { router, Stack, useNavigation } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { CATEGORIES, type Coords } from '../domain/types';
import { describeCoords, getCurrentCoords, locateAddress } from '../location/currentLocation';
import { googlePlacesEnabled, type GooglePlace } from '../places/googlePlaces';
import { useStore, type PlaceInput } from '../state/store';
import { Body, Button, Card, Chip, ChipGroup, Label, Screen, Section, SwitchRow, TextField } from './components';
import { confirm, notify } from './confirm';
import { GooglePlaceSearch } from './GooglePlaceSearch';
import { HeaderButton } from './HeaderButton';
import { spacing, type, useColors } from './theme';

const EMPTY: PlaceInput = { name: '', category: 'restaurant', coords: null, address: '', alerts: true };

/**
 * Where the location came from. 'auto' is the position filled in when the form
 * opened: it's only a guess, so typing an address replaces it.
 */
type LocationSource = 'saved' | 'auto' | 'here' | 'google' | 'address';

interface Found {
  coords: Coords;
  address: string;
}

/** The current position and its street address, or null if location isn't allowed. */
async function findHere(): Promise<Found | null> {
  const coords = await getCurrentCoords();
  return coords ? { coords, address: await describeCoords(coords) } : null;
}

/** Shared by the "new place" and "edit place" screens. */
export function PlaceForm({
  initial,
  locateOnOpen,
  search,
  onSave,
}: {
  initial?: PlaceInput;
  /** Fill in the current location straight away, if location is already allowed. */
  locateOnOpen?: boolean;
  /** Offer a Google Maps search that fills in the form (when an API key is set up). */
  search?: boolean;
  onSave: (input: PlaceInput) => Promise<void>;
}) {
  const c = useColors();
  const navigation = useNavigation();
  const start = initial ?? EMPTY;
  const [form, setForm] = useState<PlaceInput>(start);
  const [source, setSource] = useState<LocationSource | null>(initial?.coords ? 'saved' : null);
  // Read once: only locate automatically if location is already allowed when the form opens.
  const [autoLocate] = useState(
    () => !!locateOnOpen && !initial?.coords && useStore.getState().locationPermission === 'granted',
  );
  const [locating, setLocating] = useState(autoLocate);
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState('');
  const showSearch = !!search && googlePlacesEnabled;
  const update = (patch: Partial<PlaceInput>) => setForm((f) => ({ ...f, ...patch }));

  // Leaving with unsaved typing (swipe down, back) asks first. The automatic location doesn't count.
  const dirty =
    form.name.trim() !== start.name.trim() ||
    form.address.trim() !== start.address.trim() ||
    form.category !== start.category ||
    (source !== null && source !== 'auto' && source !== 'saved');
  const leaving = useRef(false);
  usePreventRemove(dirty && !saving, ({ data }) => {
    // Saving navigates away itself; that's never a discard.
    if (leaving.current) {
      navigation.dispatch(data.action);
      return;
    }
    confirm('Discard changes?', 'What you entered for this place will be lost.', 'Discard', true).then((discard) => {
      if (discard) navigation.dispatch(data.action);
    });
  });

  const applyFound = (found: Found | null, auto: boolean) => {
    if (found) {
      setForm((f) =>
        // Don't let the automatic lookup overwrite a location chosen in the meantime.
        auto && f.coords
          ? f
          : {
              ...f,
              coords: found.coords,
              address: auto && f.address ? f.address : found.address || f.address,
              // A place getting its first location starts with reminders on.
              alerts: f.coords ? f.alerts : true,
            },
      );
      setSource((s) => (auto && s ? s : auto ? 'auto' : 'here'));
    } else if (!auto) {
      notify('Location is off', 'Allow location access in Settings to save where a place is.');
    }
  };
  const fail = (auto: boolean) => {
    if (!auto) notify("Couldn't find you", 'Check that location services are on and try again.');
  };

  const locateMe = () => {
    setLocating(true);
    findHere()
      .then((found) => applyFound(found, false))
      .catch(() => fail(false))
      .finally(() => setLocating(false));
  };

  useEffect(() => {
    if (!autoLocate) return;
    findHere()
      .then((found) => applyFound(found, true))
      .catch(() => fail(true))
      .finally(() => setLocating(false));
    // Only on open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeAddress = (address: string) => {
    // A typed address beats the position guessed on open: drop it, and look the address up on save.
    if (source === 'auto') {
      setForm((f) => ({ ...f, address, coords: null }));
      setSource(null);
    } else {
      update({ address });
    }
  };

  const fillFromGoogle = (g: GooglePlace) => {
    setForm((f) => ({
      ...f,
      name: g.name || f.name,
      category: g.category,
      address: g.address,
      coords: g.coords ?? f.coords,
      alerts: f.coords ? f.alerts : true,
    }));
    if (g.coords) setSource('google');
    setNameError('');
  };

  const removeLocation = () => {
    update({ coords: null, alerts: false });
    setSource(null);
  };

  const save = async () => {
    if (!form.name.trim()) {
      setNameError('Give the place a name so you can find it later.');
      return;
    }
    setSaving(true);
    leaving.current = true;
    try {
      // A typed address without a map location: look it up, so reminders can work.
      const coords = form.coords ?? (await locateAddress(form.address));
      await onSave(coords && !form.coords ? { ...form, coords, alerts: true } : form);
    } catch {
      notify("Couldn't save", 'Please try again.');
      leaving.current = false;
      setSaving(false);
    }
  };

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen
        options={{
          headerLeft: ({ tintColor }) => (
            <HeaderButton title="Cancel" tintColor={tintColor} onPress={() => router.back()} />
          ),
          headerRight: ({ tintColor }) => (
            <HeaderButton title="Save" bold tintColor={tintColor} onPress={save} disabled={saving} />
          ),
        }}
      />

      {showSearch ? <GooglePlaceSearch onPick={fillFromGoogle} autoFocus={!initial} /> : null}

      <TextField
        label="Name"
        placeholder="e.g. Luigi's Pizzeria"
        value={form.name}
        onChangeText={(name) => {
          update({ name });
          if (name.trim()) setNameError('');
        }}
        error={nameError}
        autoFocus={!initial && !showSearch}
        autoCapitalize="words"
        returnKeyType="done"
      />

      <View style={{ gap: spacing.sm }}>
        <Label header style={{ marginLeft: spacing.xs }}>
          Type
        </Label>
        <ChipGroup label="Type">
          {CATEGORIES.map((cat) => (
            <Chip
              key={cat.value}
              label={cat.label}
              selected={form.category === cat.value}
              onPress={() => update({ category: cat.value })}
            />
          ))}
        </ChipGroup>
      </View>

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Label header style={{ flex: 1 }}>
            Location
          </Label>
          {form.coords && !locating ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Remove location"
              onPress={removeLocation}
              hitSlop={10}
              style={{ minHeight: 32, justifyContent: 'center' }}
            >
              <Text style={[type.footnote, { color: c.danger, fontWeight: '600' }]}>Remove</Text>
            </Pressable>
          ) : null}
        </View>
        <View accessibilityLiveRegion="polite">
          {locating ? (
            <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
              <ActivityIndicator color={c.muted} accessibilityLabel="Finding your location" />
              <Body muted>Finding where you are…</Body>
            </View>
          ) : (
            <LocationSummary coords={form.coords} source={source} address={form.address} />
          )}
        </View>
        <Button
          title={form.coords ? 'Use where I am now instead' : 'Use where I am now'}
          kind="secondary"
          disabled={locating}
          onPress={locateMe}
        />
      </Card>

      <TextField
        label="Address (optional)"
        placeholder="Street, area or anything that helps"
        value={form.address}
        onChangeText={changeAddress}
        textContentType="fullStreetAddress"
        autoComplete="street-address"
      />

      <Section
        footer={
          form.coords
            ? 'Get a notification with your notes when you arrive here.'
            : form.address.trim()
              ? 'The address will be found on the map when you save, so reminders can work.'
              : 'Set a location above, or type an address, to get reminders when you arrive.'
        }
      >
        <SwitchRow
          title="Remind me when I'm here"
          value={form.alerts && !!form.coords}
          disabled={!form.coords}
          onValueChange={(alerts) => update({ alerts })}
          last
        />
      </Section>

      <Button title="Save place" onPress={save} disabled={saving} />
    </Screen>
  );
}

function LocationSummary({
  coords,
  source,
  address,
}: {
  coords: Coords | null;
  source: LocationSource | null;
  address: string;
}) {
  const c = useColors();
  if (!coords) {
    return <Body muted>{address.trim() ? 'Will be found from the address when you save.' : 'Not set'}</Body>;
  }
  const where = {
    saved: 'On the map',
    auto: 'Your current spot',
    here: 'Your current spot',
    google: 'From Google Maps',
    address: 'Found from the address',
  }[source ?? 'saved'];
  return (
    <View style={{ gap: 2 }}>
      <Body style={{ fontWeight: '600' }}>📍 {where}</Body>
      {source === 'auto' ? (
        <Text style={[type.footnote, { color: c.muted }]}>
          Not here right now? Search for the place or type its address instead.
        </Text>
      ) : null}
    </View>
  );
}
