import type { Note, Place } from '../domain/types';

/** Everything the app keeps, stored on the device only. */
export interface Repository {
  loadPlaces(): Promise<Place[]>;
  loadNotes(): Promise<Note[]>;
  savePlace(place: Place): Promise<void>;
  /** Deletes the place and all of its notes. */
  deletePlace(id: string): Promise<void>;
  saveNote(note: Note): Promise<void>;
  deleteNote(id: string): Promise<void>;
  getValue<T>(key: string): Promise<T | null>;
  setValue(key: string, value: unknown): Promise<void>;
}
