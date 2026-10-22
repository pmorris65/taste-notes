import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { VERDICTS, type Verdict } from '../../domain/types';
import { useStore } from '../../state/store';
import { Body, Button, Screen, Segmented, TextField } from '../../ui/components';
import { confirm, notify } from '../../ui/confirm';
import { HeaderButton } from '../../ui/HeaderButton';

export default function EditNote() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const note = useStore((s) => s.notes.find((n) => n.id === id));
  const { updateNote, deleteNote } = useStore.getState();
  const [text, setText] = useState(note?.text ?? '');
  const [verdict, setVerdict] = useState<Verdict>(note?.verdict ?? 'like');

  if (!note) {
    return (
      <Screen edges={['bottom']}>
        <Body muted>This note no longer exists.</Body>
      </Screen>
    );
  }

  const save = async () => {
    if (!text.trim()) return;
    try {
      await updateNote(note.id, { text, verdict });
      router.back();
    } catch {
      notify("Couldn't save", 'Please try again.');
    }
  };

  const remove = async () => {
    if (!(await confirm('Delete this note?', note.text, 'Delete', true))) return;
    try {
      await deleteNote(note.id);
      router.back();
    } catch {
      notify("Couldn't delete", 'Please try again.');
    }
  };

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen
        options={{
          headerLeft: ({ tintColor }) => <HeaderButton title="Cancel" tintColor={tintColor} onPress={() => router.back()} />,
          headerRight: ({ tintColor }) => (
            <HeaderButton title="Save" bold tintColor={tintColor} onPress={save} disabled={!text.trim()} />
          ),
        }}
      />
      <TextField
        label="Note"
        value={text}
        onChangeText={setText}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={save}
      />
      <Segmented
        label="Verdict"
        options={VERDICTS.map((v) => ({ value: v.value, label: `${v.emoji} ${v.label}`, a11yLabel: v.label }))}
        value={verdict}
        onChange={setVerdict}
      />
      <Button title="Delete note" kind="danger" onPress={remove} />
    </Screen>
  );
}
