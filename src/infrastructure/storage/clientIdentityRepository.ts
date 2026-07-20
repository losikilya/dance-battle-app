import { createId } from '../../shared/lib/createId';
import { getDatabase } from './database';
import { runMigrations } from './migrations';

const CLIENT_DEVICE_ID_KEY = 'judgingClient.deviceId';

type MetadataRow = {
  value: string;
};

let deviceIdPromise: Promise<string> | null = null;

async function loadOrCreateClientDeviceId(): Promise<string> {
  const db = await getDatabase();
  await runMigrations(db);

  const row = await db.getFirstAsync<MetadataRow>(
    'SELECT value FROM app_metadata WHERE key = ?',
    CLIENT_DEVICE_ID_KEY,
  );

  if (row?.value) {
    return row.value;
  }

  const deviceId = createId('device');

  await db.runAsync(
    'INSERT OR REPLACE INTO app_metadata (key, value) VALUES (?, ?)',
    CLIENT_DEVICE_ID_KEY,
    deviceId,
  );

  return deviceId;
}

export function getOrCreateClientDeviceId(): Promise<string> {
  if (!deviceIdPromise) {
    deviceIdPromise = loadOrCreateClientDeviceId().catch((error: unknown) => {
      deviceIdPromise = null;
      throw error;
    });
  }

  return deviceIdPromise;
}
