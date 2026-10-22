import type { Note, Verdict } from '../domain/types';

/** How a place went overall: mostly liked, mostly not, or mixed / no notes yet. */
export type Leaning = 'liked' | 'disliked' | 'mixed';

export function leaning(notes: Note[]): Leaning {
  const count = (v: Verdict) => notes.filter((n) => n.verdict === v).length;
  const likes = count('like');
  const dislikes = count('dislike');
  if (likes > dislikes) return 'liked';
  if (dislikes > likes) return 'disliked';
  return 'mixed';
}

/** A short line like "👍 2 · 😐 1 · 👎 1", or "No notes yet". */
export function noteCounts(notes: Note[]): string {
  const parts = (
    [
      ['like', '👍'],
      ['meh', '😐'],
      ['dislike', '👎'],
    ] as const
  )
    .map(([v, emoji]) => [emoji, notes.filter((n) => n.verdict === v).length] as const)
    .filter(([, n]) => n > 0)
    .map(([emoji, n]) => `${emoji} ${n}`);
  return parts.length ? parts.join(' · ') : 'No notes yet';
}
