import { createMemoryRepository, type MemorySnapshot } from './memoryRepository';
import type { Repository } from './repository';

/**
 * Web preview only. Data is kept in localStorage so the app can be tried in a
 * browser during development. The web build is not a shipping target.
 */
const STORAGE_KEY = 'tn.preview';

let repo: Repository | null = null;

export async function openRepository(): Promise<Repository> {
  if (repo) return repo;
  let initial: MemorySnapshot | null = null;
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (raw) initial = JSON.parse(raw);
  } catch {
    initial = null;
  }
  repo = createMemoryRepository(initial, (snapshot) => {
    try {
      globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // Storage full or blocked: keep working in memory.
    }
  });
  return repo;
}
