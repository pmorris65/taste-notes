import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { AccessibilityInfo, Platform, Pressable, StyleSheet, Text, View, type TextInput } from 'react-native';

import { formatDistance, placeDistance } from '../../domain/geo';
import { CATEGORIES, VERDICTS, type Note, type Verdict } from '../../domain/types';
import { getCurrentCoords, locateAddress } from '../../location/currentLocation';
import { enableArrivalReminders } from '../../location/enableReminders';
import { ALERTS_PROBLEMS } from '../../location/geofence';
import { useStore } from '../../state/store';
import { Body, Button, Card, Label, Row, Screen, Section, SwitchRow, TextField } from '../../ui/components';
import { confirm, notify } from '../../ui/confirm';
import { HeaderButton } from '../../ui/HeaderButton';
import { radius, spacing, type, useColors, verdictColor } from '../../ui/theme';

const shortDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

export default function PlaceDetail() {
  const c = useColors();
  const { id, focus } = useLocalSearchParams<{ id: string; focus?: string }>();
  const place = useStore((s) => s.places.find((p) => p.id === id));
  const allNotes = useStore((s) => s.notes);
  const here = useStore((s) => s.here);
  const alertsOn = useStore((s) => s.settings.arrivalAlerts);
  const units = useStore((s) => s.settings.units);
  const { addNote, deletePlace, updatePlace } = useStore.getState();
  const [text, setText] = useState('');
  const [lastVerdict, setLastVerdict] = useState<Verdict>('like');
  const [locating, setLocating] = useState(false);
  const input = useRef<TextInput>(null);
  const submitting = useRef(false);

  if (!place) {
    return (
      <Screen edges={['bottom']}>
        <Body muted>This place no longer exists.</Body>
      </Screen>
    );
  }

  const notes = allNotes
    .filter((n) => n.placeId === place.id)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const distance = placeDistance(place, here);
  const meta = [
    CATEGORIES.find((cat) => cat.value === place.category)?.label,
    distance !== null ? `${formatDistance(distance, units)} away` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const add = async (verdict: Verdict) => {
    const value = text.trim();
    if (!value || submitting.current) return;
    submitting.current = true;
    setText('');
    setLastVerdict(verdict);
    try {
      await addNote(place.id, value, verdict);
      AccessibilityInfo.announceForAccessibility('Note added');
    } catch {
      setText(value);
      notify("Couldn't save", 'Please try again.');
    } finally {
      submitting.current = false;
      // Keep typing: the next note can go straight in.
      input.current?.focus();
    }
  };

  /** Gives a place without coordinates a map location, so it can have reminders. */
  const setLocation = async (from: 'address' | 'here') => {
    if (from === 'here' && !(await confirm(`Are you at ${place.name} now?`, 'Its location will be set to where you are.', 'Yes, use my location'))) {
      return;
    }
    setLocating(true);
    try {
      const coords = from === 'address' ? await locateAddress(place.address) : await getCurrentCoords();
      if (coords) await updatePlace(place.id, { coords, alerts: true });
      else if (from === 'address') notify("Couldn't find that address", 'Tap Edit to search for the place or fix the address.');
      else notify('Location is off', 'Allow location access in Settings to use where you are.');
    } catch {
      notify("Couldn't get a location", 'Please try again.');
    } finally {
      setLocating(false);
    }
  };

  const turnOnReminders = async () => {
    const result = await enableArrivalReminders();
    if (result && result !== 'ok') notify('Reminders need permission', ALERTS_PROBLEMS[result]);
  };

  const removePlace = async () => {
    if (!(await confirm(`Delete ${place.name}?`, 'The place and all its notes will be deleted.', 'Delete', true))) return;
    try {
      await deletePlace(place.id);
      router.back();
    } catch {
      notify("Couldn't delete", 'Please try again.');
    }
  };

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen
        options={{
          headerRight: ({ tintColor }) => (
            <HeaderButton
              title="Edit"
              tintColor={tintColor}
              accessibilityLabel={`Edit ${place.name}`}
              onPress={() => router.push({ pathname: '/edit/[id]', params: { id: place.id } })}
            />
          ),
        }}
      />

      <View style={{ gap: 4 }}>
        <Text style={[type.title, { color: c.text }]} accessibilityRole="header">
          {place.name}
        </Text>
        {meta ? <Text style={[type.subhead, { color: c.muted }]}>{meta}</Text> : null}
        {place.address ? <Text style={[type.subhead, { color: c.muted }]}>{place.address}</Text> : null}
        {place.coords ? (
          <Text
            accessibilityRole="link"
            onPress={() => router.push({ pathname: '/map', params: { focus: place.id } })}
            style={[type.subhead, { color: c.accent, fontWeight: '600', paddingVertical: 6, alignSelf: 'flex-start' }]}
          >
            Show on map
          </Text>
        ) : null}
      </View>

      {!place.coords ? (
        <Card style={{ backgroundColor: c.warningSoft, borderColor: c.warningSoft }}>
          <Label header>No map location</Label>
          <Body>Reminders need to know where this place is on the map. The address alone isn&apos;t enough.</Body>
          {place.address ? (
            <Button title="Find address on the map" onPress={() => setLocation('address')} disabled={locating} />
          ) : null}
          <Button
            title="I'm here now: use my location"
            kind={place.address ? 'secondary' : 'primary'}
            onPress={() => setLocation('here')}
            disabled={locating}
          />
        </Card>
      ) : null}

      <Card>
        <Label header>Add a note</Label>
        <TextField
          ref={input}
          accessibilityLabel="Note"
          accessibilityHint="Then choose Liked, Meh or Didn't like to save it"
          placeholder="What did you have?"
          value={text}
          onChangeText={setText}
          onSubmitEditing={() => add(lastVerdict)}
          autoFocus={focus === 'note'}
          returnKeyType="send"
          submitBehavior="submit"
          // react-native-web ignores submitBehavior and blurs after Enter unless told the older way.
          {...(Platform.OS === 'web' ? { blurOnSubmit: false } : null)}
        />
        <View style={styles.verdicts}>
          {VERDICTS.map((v) => (
            <VerdictButton
              key={v.value}
              emoji={v.emoji}
              label={v.label}
              color={verdictColor(c, v.value)}
              soft={v.value === 'like' ? c.likeSoft : v.value === 'dislike' ? c.dislikeSoft : c.surfaceAlt}
              disabled={!text.trim()}
              onPress={() => add(v.value)}
            />
          ))}
        </View>
        {notes.length === 0 ? (
          <Text style={[type.footnote, { color: c.muted }]}>
            Type what you had, then tap whether you liked it. Notes show up below.
          </Text>
        ) : null}
      </Card>

      {VERDICTS.map((v) => {
        const group = notes.filter((n) => n.verdict === v.value);
        if (!group.length) return null;
        return (
          <Section
            key={v.value}
            title={`${v.emoji} ${v.label} (${group.length})`}
            titleLabel={`${v.label}, ${group.length}`}
            titleColor={verdictColor(c, v.value)}
          >
            {group.map((n: Note, i) => (
              <Row
                key={n.id}
                title={n.text}
                detail={shortDate(n.createdAt)}
                onPress={() => router.push({ pathname: '/note/[id]', params: { id: n.id } })}
                accessibilityLabel={`${n.text}, ${v.label}, ${shortDate(n.createdAt)}`}
                accessibilityHint="Opens the note to edit or delete it"
                last={i === group.length - 1}
              />
            ))}
          </Section>
        );
      })}

      <Section
        footer={
          !place.coords
            ? 'Set a map location above to turn on reminders.'
            : !alertsOn
              ? 'Arrival reminders are turned off for all places.'
              : 'You’ll get a notification with your notes when you arrive.'
        }
      >
        <SwitchRow
          title="Remind me when I'm here"
          value={place.alerts && !!place.coords}
          disabled={!place.coords}
          onValueChange={(alerts) => updatePlace(place.id, { alerts })}
          last
        />
      </Section>
      {place.coords && !alertsOn ? (
        <Button title="Turn on arrival reminders" kind="secondary" onPress={turnOnReminders} />
      ) : null}

      <Section>
        <Row title="Delete place" destructive onPress={removePlace} last />
      </Section>
    </Screen>
  );
}

function VerdictButton({
  emoji,
  label,
  color,
  soft,
  disabled,
  onPress,
}: {
  emoji: string;
  label: string;
  color: string;
  soft: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Add as ${label}`}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.verdict,
        {
          backgroundColor: disabled ? c.surfaceAlt : soft,
          borderColor: disabled ? 'transparent' : color,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text style={{ fontSize: 18 }} accessible={false}>
        {emoji}
      </Text>
      <Text numberOfLines={1} style={{ color: disabled ? c.muted : color, fontSize: 14, fontWeight: '600' }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  verdicts: { flexDirection: 'row', gap: spacing.sm },
  verdict: {
    flex: 1,
    minHeight: 56,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 4,
  },
});
