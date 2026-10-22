import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { formatDistance, placeDistance, sortPlaces } from '../domain/geo';
import { CATEGORIES, type Note, type Place, type SortMode } from '../domain/types';
import { requestLocationPermission } from '../location/currentLocation';
import { useStore } from '../state/store';
import { Body, Button, Card, Screen, Segmented, TextField } from '../ui/components';
import { radius, spacing, useColors } from '../ui/theme';

const SORTS: { value: SortMode; label: string }[] = [
  { value: 'nearby', label: 'Nearby' },
  { value: 'name', label: 'A–Z' },
  { value: 'recent', label: 'Recent' },
];

export default function Places() {
  const places = useStore((s) => s.places);
  const notes = useStore((s) => s.notes);
  const here = useStore((s) => s.here);
  const sort = useStore((s) => s.settings.sort);
  const permission = useStore((s) => s.locationPermission);
  const updateSettings = useStore((s) => s.updateSettings);
  const [query, setQuery] = useState('');

  const notesByPlace = useMemo(() => {
    const map = new Map<string, Note[]>();
    for (const n of notes) map.set(n.placeId, [...(map.get(n.placeId) ?? []), n]);
    return map;
  }, [notes]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = q
      ? places.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.address.toLowerCase().includes(q) ||
            (notesByPlace.get(p.id) ?? []).some((n) => n.text.toLowerCase().includes(q)),
        )
      : places;
    return sortPlaces(matches, sort, here);
  }, [places, notesByPlace, query, sort, here]);

  const needsLocation = sort === 'nearby' && permission !== 'granted' && permission !== 'unknown';

  return (
    <Screen
      title="Taste Notes"
      subtitle="What you like, and don't, wherever you go"
      right={
        <View style={styles.headerButtons}>
          <IconButton name="settings" label="Settings" onPress={() => router.push('/settings')} />
          <IconButton name="plus" label="Add a place" filled onPress={() => router.push('/place/new')} />
        </View>
      }
    >
      {places.length > 0 ? (
        <>
          <TextField
            placeholder="Search places and notes"
            value={query}
            onChangeText={setQuery}
            clearButtonMode="while-editing"
            autoCorrect={false}
          />
          <Segmented options={SORTS} value={sort} onChange={(s) => updateSettings({ sort: s })} />
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
        <Card>
          <Body>
            Save the restaurants, cafés and shops you go to, and jot down what you loved and what to skip next time.
          </Body>
          <Button title="Add your first place" onPress={() => router.push('/place/new')} />
        </Card>
      ) : shown.length === 0 ? (
        <Body muted>Nothing matches “{query.trim()}”.</Body>
      ) : (
        <View style={{ gap: spacing.sm }}>
          {shown.map((p) => (
            <PlaceCard key={p.id} place={p} notes={notesByPlace.get(p.id) ?? []} distance={placeDistance(p, here)} />
          ))}
        </View>
      )}
    </Screen>
  );
}

function PlaceCard({ place, notes, distance }: { place: Place; notes: Note[]; distance: number | null }) {
  const c = useColors();
  const liked = notes.filter((n) => n.verdict === 'like');
  const disliked = notes.filter((n) => n.verdict === 'dislike');
  const category = CATEGORIES.find((cat) => cat.value === place.category)?.label ?? '';
  const meta = [category, distance !== null ? formatDistance(distance) : null].filter(Boolean).join(' · ');
  const preview = [
    liked.length ? `👍 ${liked.map((n) => n.text).join(', ')}` : null,
    disliked.length ? `👎 ${disliked.map((n) => n.text).join(', ')}` : null,
  ].filter(Boolean);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${place.name}, ${meta}`}
      onPress={() => router.push({ pathname: '/place/[id]', params: { id: place.id } })}
      style={({ pressed }) => [
        styles.placeCard,
        { backgroundColor: c.surface, borderColor: c.border, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <View style={styles.placeTop}>
        <Text style={[styles.placeName, { color: c.text }]} numberOfLines={1}>
          {place.name}
        </Text>
        {place.alerts && place.coords ? <Feather name="bell" size={14} color={c.muted} /> : null}
      </View>
      <Text style={{ color: c.muted, fontSize: 13 }}>{meta}</Text>
      {preview.length ? (
        preview.map((line) => (
          <Text key={line} style={{ color: c.text, fontSize: 14 }} numberOfLines={1}>
            {line}
          </Text>
        ))
      ) : (
        <Text style={{ color: c.muted, fontSize: 14 }}>No notes yet</Text>
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
      hitSlop={6}
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
  headerButtons: { flexDirection: 'row', gap: spacing.sm },
  iconButton: { width: 42, height: 42, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  placeCard: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, padding: spacing.lg, gap: 4 },
  placeTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  placeName: { fontSize: 17, fontWeight: '600', flexShrink: 1 },
});
