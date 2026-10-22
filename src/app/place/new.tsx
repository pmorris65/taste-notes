import { router } from 'expo-router';

import { useStore } from '../../state/store';
import { PlaceForm } from '../../ui/PlaceForm';

export default function NewPlace() {
  const addPlace = useStore((s) => s.addPlace);
  return (
    <PlaceForm
      locateOnOpen
      search
      onSave={async (input) => {
        const id = await addPlace(input);
        // Close the form, then open the new place ready for the first note.
        router.back();
        router.push({ pathname: '/place/[id]', params: { id, focus: 'note' } });
      }}
    />
  );
}
