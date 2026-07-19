import { DanceEvent } from '../event/types';
import type { Participant } from '../participant/types';

export function getActiveBattleConfigurationId(event: DanceEvent): string | null {
  return event.activeBattleConfigurationId ?? event.battleConfiguration?.id ?? null;
}

export function isInBattleConfiguration(
  configId: string | null | undefined,
  item: { battleConfigurationId?: string },
): boolean {
  if (!configId) return false;
  return item.battleConfigurationId === configId || item.battleConfigurationId === undefined;
}

export function getQualificationParticipants(params: {
  event: DanceEvent;
  participants: Participant[];
}): Participant[] {
  const configId = getActiveBattleConfigurationId(params.event);

  return params.participants.filter(
    (participant) =>
      isInBattleConfiguration(configId, participant) &&
      participant.checkIn === 'present',
  );
}
