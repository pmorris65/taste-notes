# Taste Notes

Remember what you like and don't like at the restaurants, cafés, bars and shops you visit.

- **Places**: save a place with a type and its location (one tap: "Use where I am now").
- **Notes**: for each place, quickly add what you liked 👍, didn't like 👎, or thought was 😐.
- **Nearby first**: the list is sorted by distance from you (or A–Z / most recent), and you can search across places and notes.
- **Arrival reminders**: when you walk into a saved place, you get a notification listing what you liked and what to avoid. Tap it to open the place.

Everything stays on the phone (SQLite). Location is only used on the device.

## How arrival reminders work

They use the phone's built-in geofencing (`expo-location` + `expo-task-manager`), so the OS wakes the app when you enter a 100 m circle around a place, even if the app is closed. The app does not track you continuously in the background.

- iOS lets an app watch at most 20 regions, so the 20 closest places with reminders on are watched. They are re-picked as you move around (while the app is open, and on each arrival).
- Each place reminds you at most once every 3 hours. Adding a place or a note counts as a visit, so you aren't reminded about where you're standing.
- Needs location set to **Always** (iOS) / **Allow all the time** (Android), plus notifications. Settings → "Remind me when I arrive" asks for these in order.
- The geofencing task is defined in `src/location/geofence.ts` and imported from `index.ts` (the app entry), so it is registered even when the app is launched in the background.

Background location doesn't work in Expo Go, so test arrival reminders in a development build:

```bash
npx eas-cli@latest build --profile development   # or: npx expo run:ios / run:android
```

## Development

```bash
npm install
npx expo start      # dev server
npm test            # unit tests (sorting, distances, notification text)
npx tsc --noEmit    # typecheck
npx expo lint       # lint
```

## Layout

- `src/app/`: screens (Expo Router): place list, place details, new/edit place, settings
- `src/domain/`: types, distance and sorting, notification text (pure, unit-tested)
- `src/storage/`: SQLite storage (localStorage in the web preview)
- `src/location/`: current location, and geofencing for arrival reminders
- `src/notifications/`: local notifications
- `src/ui/`: theme and shared components
