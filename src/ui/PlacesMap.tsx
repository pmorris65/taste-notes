import { router } from 'expo-router';
import { useMemo, useRef } from 'react';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Note, Place } from '../domain/types';
import { useStore } from '../state/store';
import { leaning, noteCounts, type Leaning } from './placeSummary';
import { radius, spacing, type, useColors } from './theme';

/** Room around the pins when zooming to fit them all. */
const FIT_PADDING = { top: 80, right: 60, bottom: 140, left: 60 };
/** Zoom when there's a single place, or when opening on one place. */
const CLOSE_DELTA = 0.01;

/** All saved places with a location, as pins on a map (Apple Maps on iPhone). */
export function PlacesMap({ focusId }: { focusId?: string }) {
  const c = useColors();
  const scheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const places = useStore((s) => s.places);
  const notes = useStore((s) => s.notes);
  const here = useStore((s) => s.here);
  const permission = useStore((s) => s.locationPermission);
  const map = useRef<MapView>(null);

  const located = useMemo(() => places.filter((p) => p.coords), [places]);
  const unlocated = places.length - located.length;
  const notesByPlace = useMemo(() => {
    const m = new Map<string, Note[]>();
    for (const n of notes) {
      const list = m.get(n.placeId);
      if (list) list.push(n);
      else m.set(n.placeId, [n]);
    }
    return m;
  }, [notes]);

  const pinColor: Record<Leaning, string> = { liked: c.like, disliked: c.dislike, mixed: c.accent };
  const focus = located.find((p) => p.id === focusId);

  // Where to start: the place asked for, else around you, else the first place, else a wide default.
  const initialRegion: Region | undefined = (() => {
    const center = focus?.coords ?? here ?? located[0]?.coords;
    return center ? { ...center, latitudeDelta: focus ? CLOSE_DELTA : 0.05, longitudeDelta: focus ? CLOSE_DELTA : 0.05 } : undefined;
  })();

  const fitAll = () => {
    if (located.length > 1) {
      map.current?.fitToCoordinates(
        located.map((p) => p.coords!),
        { edgePadding: FIT_PADDING, animated: true },
      );
    } else if (located[0]?.coords) {
      map.current?.animateToRegion({ ...located[0].coords, latitudeDelta: CLOSE_DELTA, longitudeDelta: CLOSE_DELTA });
    }
  };

  return (
    <View style={styles.fill}>
      <MapView
        ref={map}
        style={styles.fill}
        initialRegion={initialRegion}
        onMapReady={() => {
          if (!focus) fitAll();
        }}
        showsUserLocation={permission === 'granted'}
        showsMyLocationButton
        showsPointsOfInterests={false}
        userInterfaceStyle={scheme === 'dark' ? 'dark' : 'light'}
        tintColor={c.accent}
        toolbarEnabled={false}
      >
        {located.map((p: Place) => {
          const own = notesByPlace.get(p.id) ?? [];
          return (
            <Marker
              key={p.id}
              identifier={p.id}
              coordinate={p.coords!}
              title={p.name}
              description={`${noteCounts(own)} · Tap to open`}
              pinColor={pinColor[leaning(own)]}
              onCalloutPress={() => router.push({ pathname: '/place/[id]', params: { id: p.id } })}
            />
          );
        })}
      </MapView>

      <View style={[styles.legend, { backgroundColor: c.surface, borderColor: c.border, bottom: insets.bottom + spacing.md }]}>
        <View style={styles.legendRow}>
          <Dot color={c.like} label="Mostly liked" />
          <Dot color={c.dislike} label="Mostly not" />
          <Dot color={c.accent} label="Mixed / no notes" />
        </View>
        {located.length === 0 ? (
          <Text style={[type.footnote, { color: c.muted }]}>
            No places on the map yet. Places appear here once they have a location.
          </Text>
        ) : unlocated > 0 ? (
          <Text style={[type.footnote, { color: c.muted }]}>
            {unlocated} {unlocated === 1 ? 'place has' : 'places have'} no location and {unlocated === 1 ? "isn't" : "aren't"}{' '}
            shown.
          </Text>
        ) : null}
        {located.length > 1 ? (
          <Text
            accessibilityRole="button"
            onPress={fitAll}
            style={[type.footnote, { color: c.accent, fontWeight: '600', paddingVertical: 6 }]}
          >
            Show all {located.length} places
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function Dot({ color, label }: { color: string; label: string }) {
  const c = useColors();
  return (
    <View style={styles.dotItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[type.caption, { color: c.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  legend: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: 4,
  },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  dotItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
