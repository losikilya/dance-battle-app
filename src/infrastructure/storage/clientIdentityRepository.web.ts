import { createId } from '../../shared/lib/createId';

const STORAGE_KEY = 'battleflow.webPreview.deviceId';
let memoryDeviceId: string | null = null;

export async function getOrCreateClientDeviceId(): Promise<string> {
  if (memoryDeviceId !== null) {
    return memoryDeviceId;
  }

  if (typeof window !== 'undefined') {
    const storedDeviceId = window.localStorage.getItem(STORAGE_KEY);

    if (storedDeviceId) {
      memoryDeviceId = storedDeviceId;
      return storedDeviceId;
    }
  }

  const deviceId = createId('device');
  memoryDeviceId = deviceId;

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, deviceId);
  }

  return deviceId;
}
