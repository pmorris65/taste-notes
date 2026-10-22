import { arrivalMessage } from '../summary';
import type { Note, Place, Verdict } from '../types';

const place: Place = {
  id: 'p1',
  name: 'Luigi’s',
  category: 'restaurant',
  coords: null,
  address: '',
  alerts: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

let seq = 0;
function note(text: string, verdict: Verdict, placeId = 'p1'): Note {
  seq += 1;
  return { id: `n${seq}`, placeId, text, verdict, createdAt: `2026-01-01T00:00:${String(seq).padStart(2, '0')}.000Z` };
}

describe('arrivalMessage', () => {
  it('lists likes and dislikes, newest first', () => {
    const msg = arrivalMessage(place, [
      note('Margherita', 'like'),
      note('Tiramisu', 'dislike'),
      note('Garlic bread', 'like'),
      note('Fine wine list', 'meh'),
      note('Somewhere else', 'like', 'p2'),
    ]);
    expect(msg.title).toBe("You're at Luigi’s");
    expect(msg.body).toBe('👍 Garlic bread, Margherita\n👎 Tiramisu');
  });

  it('shortens long lists', () => {
    const notes = ['A', 'B', 'C', 'D', 'E'].map((t) => note(t, 'like'));
    expect(arrivalMessage(place, notes).body).toBe('👍 E, D, C +2 more');
  });

  it('invites a note when there are none', () => {
    expect(arrivalMessage(place, [note('Meh', 'meh')]).body).toBe('No notes yet. Tap to add what you think.');
  });
});
