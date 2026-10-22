# Taste Notes

Remember what you like and don't like at the restaurants, cafés, bars and shops you visit.

- **Places**: save a place with a type and its location: one tap for "Use where I am now", or search Google Maps to fill in the name, type, address and location.
- **Notes**: for each place, quickly add what you liked 👍, didn't like 👎, or thought was 😐.
- **Nearby first**: the list is sorted by distance from you (or A–Z / most recent), and you can search across places and notes.
- **Arrival reminders**: when you walk into a saved place, you get a notification listing what you liked and what to avoid. Tap it to open the place.

- **Food colour themes**: Coffee & caramel (default), Tomato & basil, Mustard & ketchup, or Avocado & citrus, each with light and dark versions (Settings → Colour theme).

Everything stays on the phone (SQLite). Location is only used on the device.

## How arrival reminders work

They use the phone's built-in geofencing (`expo-location` + `expo-task-manager`), so the OS wakes the app when you enter a 100 m circle around a place, even if the app is closed. The app does not track you continuously in the background.

- iOS lets an app watch at most 20 regions, so the 20 closest places with reminders on are watched. They are re-picked as you move around (while the app is open, and on each arrival).
- Each place reminds you at most once every 3 hours. Adding a place or a note while you're there counts as a visit, so you aren't reminded about where you're standing.
- Needs location set to **Always** (iOS) / **Allow all the time** (Android), plus notifications. Settings → "Remind me when I arrive" asks for these in order.
- The geofencing task is defined in `src/location/geofence.ts` and imported from `index.ts` (the app entry), so it is registered even when the app is launched in the background.

Background location doesn't work in Expo Go, so test arrival reminders in a development build:

```bash
npx eas-cli@latest build --profile development   # or: npx expo run:ios / run:android
```

## Google Maps search (optional)

"Find on Google Maps" on the New place screen uses the Google Places API (New). It needs your own API key; without one the search box is hidden and everything else works.

1. In the Google Cloud console, create a project, turn on billing (there is a monthly free allowance), and enable **Places API (New)**.
2. Create an API key and restrict it to **Places API (New)**. Setting a daily quota cap is a good idea, since the key ships inside the app.
3. Copy `.env.example` to `.env.local` and set `EXPO_PUBLIC_GOOGLE_PLACES_API_KEY`. Restart `npx expo start` afterwards.

For a development build that's all: the app's code comes from your computer. For `preview`/`production` builds, also add `EXPO_PUBLIC_GOOGLE_PLACES_API_KEY` to the project's environment variables on expo.dev, since `.env.local` isn't uploaded to EAS.

While searching, what you type and your approximate location (to rank nearby results) are sent to Google.

## Development

Uses Node 24 (the exact version is in `.nvmrc`; EAS cloud builds use the same one, set in `eas.json`).

```bash
nvm install         # or `nvm use`: picks up .nvmrc
npm ci
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
- `src/places/`: Google Places search
- `src/notifications/`: local notifications
- `src/ui/`: theme and shared components
