import { router, useLocalSearchParams } from 'expo-router';

import { useStore } from '../../state/store';
import { Body, Screen } from '../../ui/components';
import { PlaceForm } from '../../ui/PlaceForm';

export default function EditPlace() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const place = useStore((s) => s.places.find((p) => p.id === id));
  const updatePlace = useStore((s) => s.updatePlace);

  if (!place) {
    return (
      <Screen edges={['bottom']}>
        <Body muted>This place no longer exists.</Body>
      </Screen>
    );
  }

  return (
    <PlaceForm
      initial={{
        name: place.name,
        category: place.category,
        coords: place.coords,
        address: place.address,
        alerts: place.alerts,
      }}
      saveLabel="Save changes"
      onSave={async (input) => {
        await updatePlace(place.id, input);
        router.back();
      }}
    />
  );
}
