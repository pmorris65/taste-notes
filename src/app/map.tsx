import { useLocalSearchParams } from 'expo-router';

import { PlacesMap } from '../ui/PlacesMap';

export default function MapScreen() {
  const { focus } = useLocalSearchParams<{ focus?: string }>();
  return <PlacesMap focusId={focus} />;
}
