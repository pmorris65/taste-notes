import { create } from 'zustand';

import { distanceMeters } from '../domain/geo';
import {
  DEFAULT_SETTINGS,
  newId,
  type Coords,
  type Note,
  type Place,
  type Settings,
  type Verdict,
} from '../domain/types';
import { LAST_ARRIVALS_KEY, SETTINGS_KEY } from '../storage/keys';
import { openRepository } from '../storage/openRepository';
import type { Repository } from '../storage/repository';

export type PlaceInput = Pick<Place, 'name' | 'category' | 'coords' | 'address' | 'alerts'>;

export type LocationPermission = 'unknown' | 'granted' | 'denied' | 'undetermined';

interface State {
  status: 'loading' | 'ready' | 'error';
  places: Place[];
  notes: Note[];
  settings: Settings;
  /** The device's latest known position while the app is open. */
  here: Coords | null;
  locationPermission: LocationPermission;

  init(): Promise<void>;
  addPlace(input: PlaceInput): Promise<string>;
  updatePlace(id: string, patch: Partial<PlaceInput>): Promise<void>;
  deletePlace(id: string): Promise<void>;
  addNote(placeId: string, text: string, verdict: Verdict): Promise<void>;
  updateNote(id: string, patch: Partial<Pick<Note, 'text' | 'verdict'>>): Promise<void>;
  deleteNote(id: string): Promise<void>;
  updateSettings(patch: Partial<Settings>): Promise<void>;
  setHere(here: Coords | null): void;
  setLocationPermission(permission: LocationPermission): void;
}

let repo: Repository | null = null;
/** Within this distance of a place, you're treated as being there. */
const NEARBY_M = 200;
const now = () => new Date().toISOString();

/**
 * Records that the user is at a place right now, so geofencing doesn't
 * immediately remind them about where they're standing.
 */
async function markVisited(r: Repository, placeId: string): Promise<void> {
  const last = (await r.getValue<Record<string, number>>(LAST_ARRIVALS_KEY)) ?? {};
  await r.setValue(LAST_ARRIVALS_KEY, { ...last, [placeId]: Date.now() });
}

export const useStore = create<State>()((set, get) => {
  const db = () => {
    if (!repo) throw new Error('Storage is not open yet.');
    return repo;
  };

  /** Saving a place or note while standing there counts as a visit; doing it from elsewhere doesn't. */
  const markVisitedIfHere = async (place: Place) => {
    const here = get().here;
    if (place.coords && here && distanceMeters(here, place.coords) < NEARBY_M) await markVisited(db(), place.id);
  };

  return {
    status: 'loading',
    places: [],
    notes: [],
    settings: DEFAULT_SETTINGS,
    here: null,
    locationPermission: 'unknown',

    async init() {
      set({ status: 'loading' });
      try {
        repo = await openRepository();
        const [places, notes, settings] = await Promise.all([
          repo.loadPlaces(),
          repo.loadNotes(),
          repo.getValue<Partial<Settings>>(SETTINGS_KEY),
        ]);
        set({ places, notes, settings: { ...DEFAULT_SETTINGS, ...settings }, status: 'ready' });
      } catch {
        set({ status: 'error' });
      }
    },

    async addPlace(input) {
      const stamp = now();
      const place: Place = { id: newId(), ...input, name: input.name.trim(), createdAt: stamp, updatedAt: stamp };
      await db().savePlace(place);
      await markVisitedIfHere(place);
      set({ places: [...get().places, place] });
      return place.id;
    },

    async updatePlace(id, patch) {
      const current = get().places.find((p) => p.id === id);
      if (!current) return;
      const place: Place = { ...current, ...patch, updatedAt: now() };
      if (patch.name !== undefined) place.name = patch.name.trim();
      await db().savePlace(place);
      set({ places: get().places.map((p) => (p.id === id ? place : p)) });
    },

    async deletePlace(id) {
      await db().deletePlace(id);
      set({ places: get().places.filter((p) => p.id !== id), notes: get().notes.filter((n) => n.placeId !== id) });
    },

    async addNote(placeId, text, verdict) {
      const note: Note = { id: newId(), placeId, text: text.trim(), verdict, createdAt: now() };
      await db().saveNote(note);
      const place = get().places.find((p) => p.id === placeId);
      if (place) await markVisitedIfHere(place);
      set({ notes: [...get().notes, note] });
      // Count a new note as activity on the place, for "Recent" sorting.
      await get().updatePlace(placeId, {});
    },

    async updateNote(id, patch) {
      const current = get().notes.find((n) => n.id === id);
      if (!current) return;
      const note: Note = { ...current, ...patch, text: (patch.text ?? current.text).trim() };
      await db().saveNote(note);
      set({ notes: get().notes.map((n) => (n.id === id ? note : n)) });
    },

    async deleteNote(id) {
      await db().deleteNote(id);
      set({ notes: get().notes.filter((n) => n.id !== id) });
    },

    async updateSettings(patch) {
      const settings = { ...get().settings, ...patch };
      set({ settings });
      await db().setValue(SETTINGS_KEY, settings);
    },

    setHere(here) {
      set({ here });
    },

    setLocationPermission(locationPermission) {
      set({ locationPermission });
    },
  };
});
