import { AppEvent } from '../../domain/sync/appEvent';

let appEvents: AppEvent[] = [];

export async function saveAppEvent(event: AppEvent): Promise<void> {
  if (!appEvents.some((item) => item.id === event.id)) {
    appEvents = [...appEvents, event];
  }
}

export async function saveAppEvents(events: AppEvent[]): Promise<void> {
  for (const event of events) {
    await saveAppEvent(event);
  }
}

export async function replaceAppEvents(events: AppEvent[]): Promise<void> {
  appEvents = [...events];
}

export async function loadAppEvents(): Promise<AppEvent[]> {
  return [...appEvents];
}

export async function clearAppEvents(): Promise<void> {
  appEvents = [];
}
