import type { SQLiteDatabase } from 'expo-sqlite';

import { AppEvent } from '../../domain/sync/appEvent';
import { getDatabase } from './database';
import { runMigrations } from './migrations';

type AppEventRow = {
  event_json: string;
};

let initializationPromise: Promise<SQLiteDatabase> | null = null;

async function ensureInitialized(): Promise<SQLiteDatabase> {
  if (!initializationPromise) {
    initializationPromise = getDatabase().then(async (db) => {
      await runMigrations(db);
      return db;
    });
  }

  return initializationPromise;
}

async function insertAppEvent(
  db: SQLiteDatabase,
  event: AppEvent,
): Promise<void> {
  await db.runAsync(
    `
      INSERT OR IGNORE INTO app_events (
        id,
        type,
        event_json,
        created_at
      )
      VALUES (?, ?, ?, ?)
    `,
    event.id,
    event.type,
    JSON.stringify(event),
    event.createdAt,
  );
}

export async function saveAppEvent(event: AppEvent): Promise<void> {
  const db = await ensureInitialized();

  await insertAppEvent(db, event);
}

export async function saveAppEvents(events: AppEvent[]): Promise<void> {
  const db = await ensureInitialized();

  await db.withTransactionAsync(async () => {
    for (const event of events) {
      await insertAppEvent(db, event);
    }
  });
}

export async function replaceAppEvents(events: AppEvent[]): Promise<void> {
  const db = await ensureInitialized();

  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM app_events');

    for (const event of events) {
      await insertAppEvent(db, event);
    }
  });
}

export async function loadAppEvents(): Promise<AppEvent[]> {
  const db = await ensureInitialized();

  const rows = await db.getAllAsync<AppEventRow>(`
    SELECT event_json
    FROM app_events
    ORDER BY sequence ASC
  `);

  return rows
    .map((row) => {
      try {
        return JSON.parse(row.event_json) as AppEvent;
      } catch {
        return null;
      }
    })
    .filter((event): event is AppEvent => event !== null);
}

export async function clearAppEvents(): Promise<void> {
  const db = await ensureInitialized();

  await db.runAsync('DELETE FROM app_events');
}
