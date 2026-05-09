import { createId } from '../../shared/lib/createId';
import { AppEvent } from './appEvent';

export function createAppEvent<TType extends AppEvent['type']>(
  type: TType,
  payload: Extract<AppEvent, { type: TType }>['payload'],
): Extract<AppEvent, { type: TType }> {
  return {
    id: createId('event'),
    type,
    payload,
    createdAt: new Date().toISOString(),
  } as Extract<AppEvent, { type: TType }>;
}