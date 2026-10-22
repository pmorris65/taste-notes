import type { Note, Place, Verdict } from './types';

const MAX_ITEMS = 3;

function list(notes: Note[], verdict: Verdict): string[] {
  return notes
    .filter((n) => n.verdict === verdict)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .map((n) => n.text.trim())
    .filter(Boolean);
}

function join(items: string[]): string {
  const shown = items.slice(0, MAX_ITEMS).join(', ');
  const more = items.length - MAX_ITEMS;
  return more > 0 ? `${shown} +${more} more` : shown;
}

/** The text of the notification shown when arriving at a place. */
export function arrivalMessage(place: Place, notes: Note[]): { title: string; body: string } {
  const own = notes.filter((n) => n.placeId === place.id);
  const liked = list(own, 'like');
  const disliked = list(own, 'dislike');
  const parts: string[] = [];
  if (liked.length) parts.push(`👍 ${join(liked)}`);
  if (disliked.length) parts.push(`👎 ${join(disliked)}`);
  return {
    title: `You're at ${place.name}`,
    body: parts.length ? parts.join('\n') : 'No notes yet. Tap to add what you think.',
  };
}
