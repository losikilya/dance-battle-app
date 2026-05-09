import { createId } from '../../shared/lib/createId';
import { AppCommand } from './command';

export function createCommand<TType extends AppCommand['type']>(
  type: TType,
  payload: Extract<AppCommand, { type: TType }>['payload'],
): Extract<AppCommand, { type: TType }> {
  return {
    id: createId('command'),
    type,
    payload,
    createdAt: new Date().toISOString(),
  } as Extract<AppCommand, { type: TType }>;
}