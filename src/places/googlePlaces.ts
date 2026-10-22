import { categoryFromGoogleTypes } from '../domain/googleCategory';
import type { Category, Coords } from '../domain/types';

/**
 * Place search with the Google Places API (New), called directly over HTTPS.
 * Needs EXPO_PUBLIC_GOOGLE_PLACES_API_KEY (see README); without it the search
 * box is hidden. What the user types, and their approximate location for
 * ranking nearby results, are sent to Google only while they search.
 */

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ?? '';
const BASE_URL = 'https://places.googleapis.com/v1';
/** Prefer results within this distance of the user. Google allows up to 50 km. */
const BIAS_RADIUS_M = 20_000;
const DETAIL_FIELDS = 'id,displayName,formattedAddress,shortFormattedAddress,location,primaryType,types';

export const googlePlacesEnabled = API_KEY.length > 0;

export interface PlaceSuggestion {
  placeId: string;
  name: string;
  detail: string;
}

export interface GooglePlace {
  name: string;
  address: string;
  coords: Coords | null;
  category: Category;
}

interface AutocompleteResponse {
  suggestions?: {
    placePrediction?: {
      placeId: string;
      text?: { text: string };
      structuredFormat?: { mainText?: { text: string }; secondaryText?: { text: string } };
    };
  }[];
}

interface PlaceResponse {
  displayName?: { text: string };
  formattedAddress?: string;
  shortFormattedAddress?: string;
  location?: { latitude: number; longitude: number };
  primaryType?: string;
  types?: string[];
}

/**
 * Groups one search's requests for billing: Google charges a typing session
 * that ends in picking a place as one unit. Must be URL-safe and at most 36
 * characters; a version 4 UUID is what Google suggests.
 */
export function newSessionToken(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    return (ch === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

async function call<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': API_KEY, ...init.headers },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error?.message ?? `Google Places request failed (${res.status})`);
  return body as T;
}

export async function searchPlaces(
  input: string,
  near: Coords | null,
  sessionToken: string,
  signal?: AbortSignal,
): Promise<PlaceSuggestion[]> {
  const body = {
    input,
    sessionToken,
    ...(near ? { locationBias: { circle: { center: near, radius: BIAS_RADIUS_M } } } : {}),
  };
  const data = await call<AutocompleteResponse>('/places:autocomplete', {
    method: 'POST',
    body: JSON.stringify(body),
    signal,
  });
  return (data.suggestions ?? []).flatMap(({ placePrediction: p }) =>
    p
      ? [
          {
            placeId: p.placeId,
            name: p.structuredFormat?.mainText?.text ?? p.text?.text ?? '',
            detail: p.structuredFormat?.secondaryText?.text ?? '',
          },
        ]
      : [],
  );
}

/** Looks up a suggestion's details. Ends the search session. */
export async function getPlace(placeId: string, sessionToken: string): Promise<GooglePlace> {
  const p = await call<PlaceResponse>(
    `/places/${encodeURIComponent(placeId)}?sessionToken=${encodeURIComponent(sessionToken)}`,
    { method: 'GET', headers: { 'X-Goog-FieldMask': DETAIL_FIELDS } },
  );
  return {
    name: p.displayName?.text ?? '',
    address: p.shortFormattedAddress ?? p.formattedAddress ?? '',
    coords: p.location ? { latitude: p.location.latitude, longitude: p.location.longitude } : null,
    category: categoryFromGoogleTypes(p.primaryType, p.types),
  };
}
