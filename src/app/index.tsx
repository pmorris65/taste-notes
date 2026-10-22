import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { formatDistance, placeDistance, sortPlaces } from '../domain/geo';
import { CATEGORIES, VERDICTS, type Note, type Place, type SortMode } from '../domain/types';
import { requestLocationPermission } from '../location/currentLocation';
import { useStore } from '../state/store';
import { Body, Button, Card, Screen, Segmented, TextField } from '../ui/components';
import { radius, spacing, type, useColors, verdictColor } from '../ui/theme';

const SORTS: { value: SortMode; label: string }[] = [
  { value: 'nearby', label: 'Nearby' },
  { value: 'name', label: 'A–Z' },
  { value: 'recent', label: 'Recent' },
];

/** Lower-case and without accents, so "cafe" finds "Café". */
const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const categoryLabel = (p: Place) => CATEGORIES.find((cat) => cat.value === p.category)?.label ?? '';

export default function Places() {
  const c = useColors();
  const places = useStore((s) => s.places);
  const notes = useStore((s) => s.notes);
  const here = useStore((s) => s.here);
  const sort = useStore((s) => s.settings.sort);
  const alertsOn = useStore((s) => s.settings.arrivalAlerts);
  const permission = useStore((s) => s.locationPermission);
  const updateSettings = useStore((s) => s.updateSettings);
  const [query, setQuery] = useState('');

  const notesByPlace = useMemo(() => {
    const map = new Map<string, Note[]>();
    for (const n of notes) {
      const list = map.get(n.placeId);
      if (list) list.push(n);
      else map.set(n.placeId, [n]);
    }
    return map;
  }, [notes]);

  const q = fold(query.trim());
  const shown = useMemo(() => {
    const matches = q
      ? places.filter(
          (p) =>
            fold(p.name).includes(q) ||
            fold(p.address).includes(q) ||
            fold(categoryLabel(p)).includes(q) ||
            (notesByPlace.get(p.id) ?? []).some((n) => fold(n.text).includes(q)),
        )
      : places;
    return sortPlaces(matches, sort, here);
  }, [places, notesByPlace, q, sort, here]);

  const locationUnknown = sort === 'nearby' && !here;
  const needsLocation = places.length > 0 && sort === 'nearby' && permission !== 'granted' && permission !== 'unknown';

  return (
    <Screen
      title="Taste Notes"
      right={
        <>
          <IconButton name="settings" label="Settings" onPress={() => router.push('/settings')} />
          <IconButton name="plus" label="Add a place" filled onPress={() => router.push('/place/new')} />
        </>
      }
    >
      {places.length > 0 ? (
        <>
          <View>
            <TextField
              accessibilityLabel="Search places and notes"
              placeholder="Search places and notes"
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
              returnKeyType="search"
              style={{ paddingLeft: 40, paddingRight: query ? 44 : spacing.md }}
            />
            <Feather name="search" size={18} color={c.muted} style={styles.searchIcon} accessible={false} />
            {query ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                onPress={() => setQuery('')}
                hitSlop={6}
                style={styles.clearButton}
              >
                <Feather name="x-circle" size={18} color={c.muted} />
              </Pressable>
            ) : null}
          </View>
          <Segmented label="Sort places by" options={SORTS} value={sort} onChange={(s) => updateSettings({ sort: s })} />
          {locationUnknown && !needsLocation ? (
            <Text style={[type.footnote, { color: c.muted, marginTop: -spacing.sm }]}>
              Showing most recent until your location is known.
            </Text>
          ) : null}
        </>
      ) : null}

      {needsLocation ? (
        <Card>
          <Body>Allow location to see the closest places first.</Body>
          <Button
            title={permission === 'denied' ? 'Open Settings' : 'Allow location'}
            kind="secondary"
            onPress={() => (permission === 'denied' ? Linking.openSettings() : requestLocationPermission())}
          />
        </Card>
      ) : null}

      {places.length === 0 ? (
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: c.accentSoft, borderColor: c.highlight }]}>
            <Feather name="book-open" size={30} color={c.accent} />
          </View>
          <Text style={[type.title, { color: c.text, textAlign: 'center' }]} accessibilityRole="header">
            No places yet
          </Text>
          <Body muted style={{ textAlign: 'center' }}>
            Save the restaurants, cafés and shops you go to, and note what you loved and what to skip next time.
          </Body>
          <Button title="Add your first place" onPress={() => router.push('/place/new')} style={{ alignSelf: 'stretch' }} />
        </View>
      ) : shown.length === 0 ? (
        <View style={{ gap: spacing.sm }}>
          <Body muted>Nothing matches “{query.trim()}”.</Body>
          <Button title="Clear search" kind="secondary" onPress={() => setQuery('')} />
        </View>
      ) : (
        <View style={{ gap: spacing.sm }}>
          {shown.map((p) => (
            <PlaceCard
              key={p.id}
              place={p}
              notes={notesByPlace.get(p.id) ?? []}
              distance={placeDistance(p, here)}
              reminding={alertsOn && p.alerts && !!p.coords}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

function PlaceCard({
  place,
  notes,
  distance,
  reminding,
}: {
  place: Place;
  notes: Note[];
  distance: number | null;
  reminding: boolean;
}) {
  const c = useColors();
  const newest = [...notes].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const groups = VERDICTS.map((v) => ({ ...v, items: newest.filter((n) => n.verdict === v.value) })).filter(
    (g) => g.items.length > 0,
  );
  const meta = [categoryLabel(place), distance !== null ? formatDistance(distance) : null].filter(Boolean).join(' · ');
  const spoken = [
    place.name,
    categoryLabel(place),
    distance !== null ? `${formatDistance(distance)} away` : null,
    ...groups.map((g) => `${g.label}: ${g.items.map((n) => n.text).join(', ')}`),
    groups.length === 0 ? 'No notes yet' : null,
    reminding ? 'Reminder on' : null,
  ]
    .filter(Boolean)
    .join('. ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={spoken}
      accessibilityHint="Opens the place"
      onPress={() => router.push({ pathname: '/place/[id]', params: { id: place.id } })}
      style={({ pressed }) => [
        styles.placeCard,
        { backgroundColor: c.surface, borderColor: c.border, borderLeftColor: c.highlight, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <View style={styles.placeTop}>
        <Text style={[type.headline, { color: c.text, flex: 1 }]} numberOfLines={2}>
          {place.name}
        </Text>
        {reminding ? <Feather name="bell" size={14} color={c.muted} accessible={false} /> : null}
      </View>
      {meta ? <Text style={[type.footnote, { color: c.muted }]}>{meta}</Text> : null}
      {groups.length ? (
        groups.map((g) => (
          <Text key={g.value} style={[type.subhead, { color: c.text }]} numberOfLines={1}>
            <Text style={{ color: verdictColor(c, g.value), fontWeight: '600' }}>
              {g.emoji} {g.items.length}
            </Text>
            {'  '}
            {g.items.map((n) => n.text).join(', ')}
          </Text>
        ))
      ) : (
        <Text style={[type.subhead, { color: c.muted }]}>No notes yet</Text>
      )}
    </Pressable>
  );
}

function IconButton({
  name,
  label,
  onPress,
  filled,
}: {
  name: 'plus' | 'settings';
  label: string;
  onPress: () => void;
  filled?: boolean;
}) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [
        styles.iconButton,
        { backgroundColor: filled ? c.accent : c.surfaceAlt, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Feather name={name} size={20} color={filled ? c.onAccent : c.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iconButton: { minWidth: 44, minHeight: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  placeCard: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, borderLeftWidth: 4, padding: spacing.lg, gap: 4 },
  placeTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  searchIcon: { position: 'absolute', left: 14, top: 15 },
  clearButton: { position: 'absolute', right: 4, top: 2, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', gap: spacing.md, paddingTop: spacing.xxl, paddingHorizontal: spacing.md },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
});
