import { AppEvent } from '../../domain/sync/appEvent';
import { getDatabase } from './database';
import { runMigrations } from './migrations';

type AppEventRow = {
  event_json: string;
};

let initialized = false;

async function ensureInitialized() {
  const db = await getDatabase();

  if (!initialized) {
    await runMigrations(db);
    initialized = true;
  }

  return db;
}

export async function saveAppEvent(event: AppEvent) {
  const db = await ensureInitialized();

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

export async function saveAppEvents(events: AppEvent[]) {
  const db = await ensureInitialized();

  await db.withTransactionAsync(async () => {
    for (const event of events) {
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

export async function clearAppEvents() {
  const db = await ensureInitialized();

  await db.runAsync('DELETE FROM app_events');
}