import * as SQLite from 'expo-sqlite';

import type { Category, Note, Place, Verdict } from '../domain/types';
import type { Repository } from './repository';

/** On-device SQLite storage. Also opened by the background geofencing task. */

const DB_NAME = 'taste-notes.db';

interface PlaceRow {
  id: string;
  name: string;
  category: string;
  latitude: number | null;
  longitude: number | null;
  address: string;
  alerts: number;
  created_at: string;
  updated_at: string;
}

interface NoteRow {
  id: string;
  place_id: string;
  text: string;
  verdict: string;
  created_at: string;
}

const MIGRATIONS: string[] = [
  `CREATE TABLE places (
     id TEXT PRIMARY KEY NOT NULL,
     name TEXT NOT NULL,
     category TEXT NOT NULL,
     latitude REAL,
     longitude REAL,
     address TEXT NOT NULL DEFAULT '',
     alerts INTEGER NOT NULL DEFAULT 1,
     created_at TEXT NOT NULL,
     updated_at TEXT NOT NULL
   );
   CREATE TABLE notes (
     id TEXT PRIMARY KEY NOT NULL,
     place_id TEXT NOT NULL REFERENCES places(id) ON DELETE CASCADE,
     text TEXT NOT NULL,
     verdict TEXT NOT NULL,
     created_at TEXT NOT NULL
   );
   CREATE INDEX notes_place ON notes(place_id);
   CREATE TABLE kv (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);`,
];

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;
  while (version < MIGRATIONS.length) {
    const sql = MIGRATIONS[version];
    const next = version + 1;
    await db.withTransactionAsync(async () => {
      await db.execAsync(sql);
      await db.execAsync(`PRAGMA user_version = ${next}`);
    });
    version = next;
  }
}

function toPlace(row: PlaceRow): Place {
  return {
    id: row.id,
    name: row.name,
    category: row.category as Category,
    coords:
      row.latitude !== null && row.longitude !== null ? { latitude: row.latitude, longitude: row.longitude } : null,
    address: row.address,
    alerts: row.alerts === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toNote(row: NoteRow): Note {
  return {
    id: row.id,
    placeId: row.place_id,
    text: row.text,
    verdict: row.verdict as Verdict,
    createdAt: row.created_at,
  };
}

let opening: Promise<Repository> | null = null;

/** Opens the database once per JS context and shares it. */
export function openRepository(): Promise<Repository> {
  opening ??= open().catch((e) => {
    opening = null;
    throw e;
  });
  return opening;
}

async function open(): Promise<Repository> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  await migrate(db);

  return {
    async loadPlaces() {
      return (await db.getAllAsync<PlaceRow>('SELECT * FROM places')).map(toPlace);
    },
    async loadNotes() {
      return (await db.getAllAsync<NoteRow>('SELECT * FROM notes')).map(toNote);
    },
    async savePlace(p) {
      await db.runAsync(
        `INSERT OR REPLACE INTO places
           (id, name, category, latitude, longitude, address, alerts, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        p.id,
        p.name,
        p.category,
        p.coords?.latitude ?? null,
        p.coords?.longitude ?? null,
        p.address,
        p.alerts ? 1 : 0,
        p.createdAt,
        p.updatedAt,
      );
    },
    async deletePlace(id) {
      await db.withTransactionAsync(async () => {
        await db.runAsync('DELETE FROM notes WHERE place_id = ?', id);
        await db.runAsync('DELETE FROM places WHERE id = ?', id);
      });
    },
    async saveNote(n) {
      await db.runAsync(
        'INSERT OR REPLACE INTO notes (id, place_id, text, verdict, created_at) VALUES (?, ?, ?, ?, ?)',
        n.id,
        n.placeId,
        n.text,
        n.verdict,
        n.createdAt,
      );
    },
    async deleteNote(id) {
      await db.runAsync('DELETE FROM notes WHERE id = ?', id);
    },
    async getValue<T>(key: string) {
      const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM kv WHERE key = ?', key);
      if (!row) return null;
      try {
        return JSON.parse(row.value) as T;
      } catch {
        return null;
      }
    },
    async setValue(key, value) {
      await db.runAsync('INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)', key, JSON.stringify(value));
    },
  };
}
