import type { Note, Place } from '../domain/types';
import type { Repository } from './repository';

export interface MemorySnapshot {
  places: Place[];
  notes: Note[];
  values: Record<string, unknown>;
}

/**
 * In-memory storage, used by tests and the web preview. `onChange` lets the
 * caller persist a snapshot after every write.
 */
export function createMemoryRepository(
  initial?: MemorySnapshot | null,
  onChange?: (snapshot: MemorySnapshot) => void,
): Repository {
  const places = new Map<string, Place>((initial?.places ?? []).map((p) => [p.id, p]));
  const notes = new Map<string, Note>((initial?.notes ?? []).map((n) => [n.id, n]));
  const values = new Map<string, unknown>(Object.entries(initial?.values ?? {}));
  const changed = () =>
    onChange?.({ places: [...places.values()], notes: [...notes.values()], values: Object.fromEntries(values) });
  const clone = <T>(v: T): T => (v === undefined ? v : JSON.parse(JSON.stringify(v)));

  return {
    async loadPlaces() {
      return [...places.values()].map(clone);
    },
    async loadNotes() {
      return [...notes.values()].map(clone);
    },
    async savePlace(place) {
      places.set(place.id, clone(place));
      changed();
    },
    async deletePlace(id) {
      places.delete(id);
      for (const n of [...notes.values()]) if (n.placeId === id) notes.delete(n.id);
      changed();
    },
    async saveNote(note) {
      notes.set(note.id, clone(note));
      changed();
    },
    async deleteNote(id) {
      notes.delete(id);
      changed();
    },
    async getValue<T>(key: string) {
      return values.has(key) ? clone(values.get(key) as T) : null;
    },
    async setValue(key, value) {
      values.set(key, clone(value));
      changed();
    },
  };
}
