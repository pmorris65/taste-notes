import { Body, Screen } from './components';

/** react-native-maps has no web version; the map is only in the iPhone and Android apps. */
export function PlacesMap(_props: { focusId?: string }) {
  return (
    <Screen edges={['bottom']}>
      <Body muted>The map is available in the iPhone and Android apps.</Body>
    </Screen>
  );
}
