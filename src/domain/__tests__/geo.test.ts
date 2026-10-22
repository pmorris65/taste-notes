import { distanceMeters, formatDistance, pickGeofencePlaces, sortPlaces } from '../geo';
import type { Coords, Place } from '../types';

let seq = 0;
function place(name: string, coords: Coords | null, extra: Partial<Place> = {}): Place {
  seq += 1;
  const stamp = `2026-01-${String(seq).padStart(2, '0')}T00:00:00.000Z`;
  return { id: name, name, category: 'restaurant', coords, address: '', alerts: true, createdAt: stamp, updatedAt: stamp, ...extra };
}

const here = { latitude: 51.5007, longitude: -0.1246 };

describe('distanceMeters', () => {
  it('is zero for the same point', () => {
    expect(distanceMeters(here, here)).toBe(0);
  });

  it('matches a known distance', () => {
    // Big Ben to the Tower of London is about 2.9 km.
    const tower = { latitude: 51.5081, longitude: -0.0759 };
    expect(distanceMeters(here, tower)).toBeGreaterThan(3300);
    expect(distanceMeters(here, tower)).toBeLessThan(3500);
  });
});

describe('formatDistance', () => {
  it.each([
    [3, '10 m'],
    [124, '120 m'],
    [999, '1000 m'],
    [1240, '1.2 km'],
    [15_600, '16 km'],
  ])('%d m → %s', (m, text) => {
    expect(formatDistance(m)).toBe(text);
  });
});

describe('sortPlaces', () => {
  const near = place('Near', { latitude: 51.501, longitude: -0.1246 });
  const far = place('Far', { latitude: 51.52, longitude: -0.1246 });
  const nowhere = place('Alpha', null);
  const all = [far, nowhere, near];

  it('sorts by distance with unlocated places last', () => {
    expect(sortPlaces(all, 'nearby', here).map((p) => p.name)).toEqual(['Near', 'Far', 'Alpha']);
  });

  it('falls back to most recent without a location', () => {
    expect(sortPlaces(all, 'nearby', null).map((p) => p.name)).toEqual(['Alpha', 'Far', 'Near']);
  });

  it('sorts by name ignoring case', () => {
    const lower = place('beta', null);
    expect(sortPlaces([...all, lower], 'name', here).map((p) => p.name)).toEqual(['Alpha', 'beta', 'Far', 'Near']);
  });

  it('does not change the input', () => {
    const copy = [...all];
    sortPlaces(all, 'name', here);
    expect(all).toEqual(copy);
  });
});

describe('pickGeofencePlaces', () => {
  it('keeps the closest places with alerts on and a location', () => {
    const a = place('A', { latitude: 51.501, longitude: -0.1246 });
    const b = place('B', { latitude: 51.51, longitude: -0.1246 });
    const c = place('C', { latitude: 51.505, longitude: -0.1246 });
    const off = place('Off', { latitude: 51.5007, longitude: -0.1246 }, { alerts: false });
    const none = place('None', null);
    expect(pickGeofencePlaces([a, b, c, off, none], here, 2).map((p) => p.name)).toEqual(['A', 'C']);
  });
});
