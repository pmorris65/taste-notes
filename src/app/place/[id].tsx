import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { formatDistance, placeDistance } from '../../domain/geo';
import { CATEGORIES, VERDICTS, type Note, type Verdict } from '../../domain/types';
import { useStore } from '../../state/store';
import { Body, Button, Card, Label, Row, Screen, Section, Segmented, SwitchRow, TextField } from '../../ui/components';
import { confirm, notify } from '../../ui/confirm';
import { spacing, useColors } from '../../ui/theme';

export default function PlaceDetail() {
  const c = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const place = useStore((s) => s.places.find((p) => p.id === id));
  const allNotes = useStore((s) => s.notes);
  const here = useStore((s) => s.here);
  const alertsOn = useStore((s) => s.settings.arrivalAlerts);
  const { addNote, deleteNote, deletePlace, updatePlace } = useStore.getState();
  const [text, setText] = useState('');
  const [verdict, setVerdict] = useState<Verdict>('like');

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
    distance !== null ? `${formatDistance(distance)} away` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const add = async () => {
    if (!text.trim()) return;
    try {
      await addNote(place.id, text, verdict);
      setText('');
    } catch {
      notify("Couldn't save", 'Please try again.');
    }
  };

  const removeNote = async (note: Note) => {
    if (await confirm('Delete this note?', note.text, 'Delete', true)) await deleteNote(note.id);
  };

  const removePlace = async () => {
    if (await confirm(`Delete ${place.name}?`, 'The place and all its notes will be deleted.', 'Delete', true)) {
      router.back();
      await deletePlace(place.id);
    }
  };

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen
        options={{
          title: place.name,
          headerRight: () => (
            <Text
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/edit/[id]', params: { id: place.id } })}
              style={{ color: c.accent, fontSize: 17 }}
            >
              Edit
            </Text>
          ),
        }}
      />

      <View style={{ gap: 2 }}>
        <Body muted>{meta}</Body>
        {place.address ? <Body muted>{place.address}</Body> : null}
      </View>

      <Card>
        <Label>ADD A NOTE</Label>
        <Segmented
          options={VERDICTS.map((v) => ({ value: v.value, label: `${v.emoji} ${v.label}` }))}
          value={verdict}
          onChange={setVerdict}
        />
        <TextField
          placeholder={verdict === 'dislike' ? 'e.g. Tiramisu, too sweet' : 'e.g. Margherita pizza'}
          value={text}
          onChangeText={setText}
          onSubmitEditing={add}
          returnKeyType="done"
          submitBehavior="submit"
        />
        <Button title="Add note" onPress={add} disabled={!text.trim()} />
      </Card>

      {notes.length === 0 ? <Body muted>No notes yet. What did you have?</Body> : null}
      {VERDICTS.map((v) => {
        const group = notes.filter((n) => n.verdict === v.value);
        if (!group.length) return null;
        return (
          <Section key={v.value} title={`${v.emoji} ${v.label}`}>
            {group.map((n, i) => (
              <Row
                key={n.id}
                title={n.text}
                detail={new Date(n.createdAt).toLocaleDateString()}
                onPress={() => removeNote(n)}
                right={<Text style={{ color: c.muted, fontSize: 13 }}>Delete</Text>}
                last={i === group.length - 1}
              />
            ))}
          </Section>
        );
      })}

      <Section
        footer={
          !place.coords
            ? 'Save a location for this place (Edit) to get reminders when you arrive.'
            : !alertsOn
              ? 'Arrival reminders are off for all places. Turn them on in Settings.'
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

      <Button title="Delete place" kind="danger" onPress={removePlace} style={{ marginTop: spacing.md }} />
    </Screen>
  );
}
