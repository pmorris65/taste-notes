import type { Note, Verdict } from '../../domain/types';
import { leaning, noteCounts } from '../placeSummary';

let seq = 0;
const note = (verdict: Verdict): Note => ({
  id: `n${++seq}`,
  placeId: 'p',
  text: 'x',
  verdict,
  createdAt: '2026-01-01T00:00:00.000Z',
});

describe('leaning', () => {
  it('is liked when likes outnumber dislikes', () => {
    expect(leaning([note('like'), note('like'), note('dislike')])).toBe('liked');
  });
  it('is disliked when dislikes outnumber likes', () => {
    expect(leaning([note('dislike'), note('meh')])).toBe('disliked');
  });
  it('is mixed for a tie or no notes', () => {
    expect(leaning([note('like'), note('dislike')])).toBe('mixed');
    expect(leaning([note('meh')])).toBe('mixed');
    expect(leaning([])).toBe('mixed');
  });
});

describe('noteCounts', () => {
  it('counts each verdict, skipping empty ones', () => {
    expect(noteCounts([note('like'), note('like'), note('dislike')])).toBe('👍 2 · 👎 1');
  });
  it('says when there are no notes', () => {
    expect(noteCounts([])).toBe('No notes yet');
  });
});
