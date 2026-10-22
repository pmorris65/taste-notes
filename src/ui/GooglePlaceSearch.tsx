import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { getPlace, newSessionToken, searchPlaces, type GooglePlace, type PlaceSuggestion } from '../places/googlePlaces';
import { useStore } from '../state/store';
import { TextField } from './components';
import { notify } from './confirm';
import { radius, spacing, useColors } from './theme';

const MIN_CHARS = 2;
const DEBOUNCE_MS = 300;

/** A search box that finds places on Google Maps and hands back the picked one. */
export function GooglePlaceSearch({ onPick, autoFocus }: { onPick: (place: GooglePlace) => void; autoFocus?: boolean }) {
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
          AccessibilityInfo.announceForAccessibility(
            found.length ? `${found.length} result${found.length === 1 ? '' : 's'}` : 'No matches',
          );
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setSuggestions([]);
            setFailed(true);
          }
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
    // Old results would no longer match what's typed; clear them until the new ones arrive.
    setSuggestions([]);
    setFailed(false);
    setBusy(text.trim().length >= MIN_CHARS);
  };

  const pick = async (s: PlaceSuggestion) => {
    setBusy(true);
    try {
      const place = await getPlace(s.placeId, session.current);
      onPick(place);
      setQuery('');
      setSuggestions([]);
      AccessibilityInfo.announceForAccessibility(`Filled in ${place.name}`);
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
        autoFocus={autoFocus}
        returnKeyType="search"
      />
      {showList ? (
        <View
          style={[styles.list, { backgroundColor: c.surface, borderColor: c.controlBorder }]}
          accessibilityLiveRegion="polite"
        >
          {busy && suggestions.length === 0 ? (
            <ActivityIndicator style={styles.status} color={c.muted} accessibilityLabel="Searching" />
          ) : failed ? (
            <Text style={[styles.status, { color: c.muted }]}>
              Can&apos;t reach Google Maps right now. You can still type the name and address below.
            </Text>
          ) : suggestions.length === 0 && !busy ? (
            <Text style={[styles.status, { color: c.muted }]}>No matches. Try another spelling, or fill in the details below.</Text>
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
  list: { borderRadius: radius.md, borderWidth: 1, overflow: 'hidden' },
  row: { paddingHorizontal: spacing.lg, paddingVertical: 10, gap: 2, minHeight: 48, justifyContent: 'center' },
  status: { padding: spacing.lg },
  attribution: { fontSize: 12, textAlign: 'right', paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, paddingTop: 4 },
});
