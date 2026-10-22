import { router } from 'expo-router';

import { useStore } from '../../state/store';
import { PlaceForm } from '../../ui/PlaceForm';

export default function NewPlace() {
  const addPlace = useStore((s) => s.addPlace);
  return (
    <PlaceForm
      saveLabel="Save place"
      locateOnOpen
      search
      onSave={async (input) => {
        const id = await addPlace(input);
        router.replace({ pathname: '/place/[id]', params: { id } });
      }}
    />
  );
}
