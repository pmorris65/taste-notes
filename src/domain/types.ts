export type Verdict = 'like' | 'dislike' | 'meh';

export type Category = 'restaurant' | 'cafe' | 'bar' | 'shop' | 'other';

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'cafe', label: 'Café' },
  { value: 'bar', label: 'Bar' },
  { value: 'shop', label: 'Shop' },
  { value: 'other', label: 'Other' },
];

export const VERDICTS: { value: Verdict; label: string; emoji: string }[] = [
  { value: 'like', label: 'Liked', emoji: '👍' },
  { value: 'meh', label: 'Meh', emoji: '😐' },
  { value: 'dislike', label: "Didn't like", emoji: '👎' },
];

export interface Coords {
  latitude: number;
  longitude: number;
}

export interface Place {
  id: string;
  name: string;
  category: Category;
  /** Null when the place was saved without a location. */
  coords: Coords | null;
  address: string;
  /** Whether to get a reminder when arriving here. */
  alerts: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  placeId: string;
  /** What the note is about, e.g. "Margherita pizza" or "Corner table". */
  text: string;
  verdict: Verdict;
  createdAt: string;
}

export type SortMode = 'nearby' | 'name' | 'recent';

export interface Settings {
  /** Master switch for arrival reminders. */
  arrivalAlerts: boolean;
  sort: SortMode;
}

export const DEFAULT_SETTINGS: Settings = { arrivalAlerts: false, sort: 'nearby' };

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
