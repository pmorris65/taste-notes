import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { getPlace, newSessionToken, searchPlaces, type GooglePlace, type PlaceSuggestion } from '../places/googlePlaces';
import { useStore } from '../state/store';
import { TextField } from './components';
import { notify } from './confirm';
import { radius, spacing, useColors } from './theme';

const MIN_CHARS = 2;
const DEBOUNCE_MS = 300;

/** A search box that finds places on Google Maps and hands back the picked one. */
export function GooglePlaceSearch({ onPick }: { onPick: (place: GooglePlace) => void }) {
  const c = useColors();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const session = useRef(newSessionToken());

  useEffect(() => {
    const text = query.trim();
    if (text.length < MIN_CHARS) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setBusy(true);
      searchPlaces(text, useStore.getState().here, session.current, controller.signal)
        .then((found) => {
          setSuggestions(found);
          setFailed(false);
        })
        .catch(() => {
          if (!controller.signal.aborted) setFailed(true);
        })
        .finally(() => {
          if (!controller.signal.aborted) setBusy(false);
        });
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const change = (text: string) => {
    setQuery(text);
    if (text.trim().length < MIN_CHARS) {
      setSuggestions([]);
      setFailed(false);
    }
  };

  const pick = async (s: PlaceSuggestion) => {
    setBusy(true);
    try {
      const place = await getPlace(s.placeId, session.current);
      onPick(place);
      setQuery('');
      setSuggestions([]);
    } catch {
      notify("Couldn't load that place", 'Check your connection and try again.');
    } finally {
      // Picking a place ends the billing session; the next search starts a new one.
      session.current = newSessionToken();
      setBusy(false);
    }
  };

  const showList = query.trim().length >= MIN_CHARS;

  return (
    <View style={{ gap: spacing.sm }}>
      <TextField
        label="Find on Google Maps"
        placeholder="Search for a restaurant, café, shop…"
        value={query}
        onChangeText={change}
        autoCorrect={false}
        returnKeyType="search"
      />
      {showList ? (
        <View style={[styles.list, { backgroundColor: c.surface, borderColor: c.border }]}>
          {busy && suggestions.length === 0 ? (
            <ActivityIndicator style={styles.status} color={c.muted} />
          ) : failed ? (
            <Text style={[styles.status, { color: c.muted }]}>Search isn&apos;t working right now.</Text>
          ) : suggestions.length === 0 && !busy ? (
            <Text style={[styles.status, { color: c.muted }]}>No matches.</Text>
          ) : (
            suggestions.map((s, i) => (
              <Pressable
                key={s.placeId}
                accessibilityRole="button"
                accessibilityLabel={`${s.name}, ${s.detail}`}
                disabled={busy}
                onPress={() => pick(s)}
                style={({ pressed }) => [
                  styles.row,
                  i < suggestions.length - 1 && { borderBottomColor: c.border, borderBottomWidth: StyleSheet.hairlineWidth },
                  { opacity: pressed ? 0.6 : 1 },
                ]}
              >
                <Text style={{ color: c.text, fontSize: 16 }} numberOfLines={1}>
                  {s.name}
                </Text>
                {s.detail ? (
                  <Text style={{ color: c.muted, fontSize: 13 }} numberOfLines={1}>
                    {s.detail}
                  </Text>
                ) : null}
              </Pressable>
            ))
          )}
          <Text style={[styles.attribution, { color: c.muted }]}>Powered by Google</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  row: { paddingHorizontal: spacing.md, paddingVertical: 10, gap: 2 },
  status: { padding: spacing.md },
  attribution: { fontSize: 11, textAlign: 'right', paddingHorizontal: spacing.md, paddingBottom: spacing.sm, paddingTop: 4 },
});
