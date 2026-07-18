import { DanceEvent } from '../event/types';

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
