import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { CATEGORIES, type Coords } from '../domain/types';
import { describeCoords, getCurrentCoords } from '../location/currentLocation';
import { googlePlacesEnabled, type GooglePlace } from '../places/googlePlaces';
import { useStore, type PlaceInput } from '../state/store';
import { Body, Button, Card, Chip, ChipGroup, Label, Screen, Section, SwitchRow, TextField } from './components';
import { notify } from './confirm';
import { GooglePlaceSearch } from './GooglePlaceSearch';
import { spacing, useColors } from './theme';

const EMPTY: PlaceInput = { name: '', category: 'restaurant', coords: null, address: '', alerts: true };

/** Shared by the "new place" and "edit place" screens. */
export function PlaceForm({
  initial,
  saveLabel,
  locateOnOpen,
  search,
  onSave,
}: {
  initial?: PlaceInput;
  saveLabel: string;
  /** Fill in the current location straight away, if location is already allowed. */
  locateOnOpen?: boolean;
  /** Offer a Google Maps search that fills in the form (when an API key is set up). */
  search?: boolean;
  onSave: (input: PlaceInput) => Promise<void>;
}) {
  const c = useColors();
  const [form, setForm] = useState<PlaceInput>(initial ?? EMPTY);
  // Read once: only locate automatically if location is already allowed when the form opens.
  const [autoLocate] = useState(
    () => !!locateOnOpen && !initial?.coords && useStore.getState().locationPermission === 'granted',
  );
  const [locating, setLocating] = useState(autoLocate);
  const [saving, setSaving] = useState(false);
  const update = (patch: Partial<PlaceInput>) => setForm((f) => ({ ...f, ...patch }));

  const apply = (found: Found | null, quiet: boolean) => {
    if (found) {
      setForm((f) =>
        // Don't let the automatic lookup overwrite a place picked from search in the meantime.
        quiet && f.coords
          ? f
          : {
              ...f,
              coords: found.coords,
              address: found.address || f.address,
              // A place getting its first location starts with reminders on.
              alerts: f.coords ? f.alerts : true,
            },
      );
    } else if (!quiet) notify('Location is off', 'Allow location access in Settings to save where a place is.');
  };
  const fail = (quiet: boolean) => {
    if (!quiet) notify("Couldn't find you", 'Check that location services are on and try again.');
  };

  const locateMe = () => {
    setLocating(true);
    findHere()
      .then((found) => apply(found, false))
      .catch(() => fail(false))
      .finally(() => setLocating(false));
  };

  useEffect(() => {
    if (!autoLocate) return;
    findHere()
      .then((found) => apply(found, true))
      .catch(() => fail(true))
      .finally(() => setLocating(false));
    // Only on open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fillFromGoogle = (g: GooglePlace) => {
    setForm((f) => ({
      ...f,
      name: g.name || f.name,
      category: g.category,
      address: g.address,
      coords: g.coords ?? f.coords,
      alerts: f.coords ? f.alerts : true,
    }));
  };

  const save = async () => {
    if (!form.name.trim()) {
      notify('Name needed', 'Give the place a name so you can find it later.');
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
    } catch {
      notify("Couldn't save", 'Please try again.');
      setSaving(false);
    }
  };

  return (
    <Screen edges={['bottom']}>
      {search && googlePlacesEnabled ? <GooglePlaceSearch onPick={fillFromGoogle} /> : null}

      <TextField
        label="Name"
        placeholder="e.g. Luigi's Pizzeria"
        value={form.name}
        onChangeText={(name) => update({ name })}
        autoFocus={!initial}
        returnKeyType="done"
      />

      <View style={{ gap: spacing.sm }}>
        <Label style={{ marginLeft: spacing.xs }}>TYPE</Label>
        <ChipGroup>
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
        <Label>LOCATION</Label>
        {locating ? (
          <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
            <ActivityIndicator color={c.muted} />
            <Body muted>Finding where you are…</Body>
          </View>
        ) : (
          <Body muted={!form.coords}>{form.coords ? locationText(form.coords, form.address) : 'Not set'}</Body>
        )}
        <Button
          title={form.coords ? 'Update to where I am now' : 'Use where I am now'}
          kind="secondary"
          disabled={locating}
          onPress={locateMe}
        />
        {form.coords ? (
          <Button title="Remove location" kind="ghost" onPress={() => update({ coords: null, alerts: false })} />
        ) : null}
      </Card>

      <TextField
        label="Address (optional)"
        placeholder="Street, area or anything that helps"
        value={form.address}
        onChangeText={(address) => update({ address })}
      />

      <Section
        footer={
          form.coords
            ? 'Get a notification with your notes when you arrive here.'
            : 'Save a location to get reminders when you arrive.'
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

      <Button title={saveLabel} onPress={save} disabled={saving || locating} />
    </Screen>
  );
}

interface Found {
  coords: Coords;
  address: string;
}

/** The current position and its street address, or null if location isn't allowed. */
async function findHere(): Promise<Found | null> {
  const coords = await getCurrentCoords();
  return coords ? { coords, address: await describeCoords(coords) } : null;
}

function locationText(coords: Coords, address: string): string {
  return address || `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`;
}
