import { Battle, BattleRound } from './types';
import { createId } from '../../shared/lib/createId';

export function generateSemifinalsFromTop8(top8Battles: Battle[]): Battle[] {
  const sortedBattles = [...top8Battles].sort((a, b) => a.slot - b.slot);

  if (sortedBattles.length !== 4) {
    throw new Error('Top 8 should contain exactly 4 battles');
  }

  const winners = sortedBattles.map((battle) => battle.winnerId);

  if (winners.some((winnerId) => !winnerId)) {
    throw new Error('All Top 8 battles must have winners');
  }

  return [
    {
      id: createId('battle'),
      round: 'semifinal',
      slot: 1,
      participantIds: [winners[0] as string, winners[1] as string],
      participantAId: winners[0] as string,
      participantBId: winners[1] as string,
      status: 'pending',
    },
    {
      id: createId('battle'),
      round: 'semifinal',
      slot: 2,
      participantIds: [winners[2] as string, winners[3] as string],
      participantAId: winners[2] as string,
      participantBId: winners[3] as string,
      status: 'pending',
    },
  ];
}

export function generateFinalFromSemifinals(semifinalBattles: Battle[]): Battle {
  const sortedBattles = [...semifinalBattles].sort((a, b) => a.slot - b.slot);

  if (sortedBattles.length !== 2) {
    throw new Error('Semifinal should contain exactly 2 battles');
  }

  const winners = sortedBattles.map((battle) => battle.winnerId);

  if (winners.some((winnerId) => !winnerId)) {
    throw new Error('All semifinal battles must have winners');
  }

  return {
    id: createId('battle'),
    round: 'final',
    slot: 1,
    participantIds: [winners[0] as string, winners[1] as string],
    participantAId: winners[0] as string,
    participantBId: winners[1] as string,
    status: 'pending',
  };
}

const NEXT_ROUND: Partial<Record<BattleRound, BattleRound>> = {
  custom: 'custom',
  top32: 'top16',
  top16: 'top8',
  top8: 'semifinal',
  semifinal: 'final',
};

export function generateNextRound(currentBattles: Battle[]): Battle[] {
  const sortedBattles = [...currentBattles].sort((a, b) => a.slot - b.slot);
  const currentRound = sortedBattles[0]?.round;
  const nextRound = currentRound ? NEXT_ROUND[currentRound] : undefined;

  if (!currentRound || !nextRound || sortedBattles.some((battle) => battle.round !== currentRound)) {
    throw new Error('Current bracket round is invalid');
  }

  const winners = sortedBattles.map((battle) => battle.winnerId);

  if (winners.some((winnerId) => !winnerId) || winners.length < 2) {
    throw new Error('All battles in the current round must have winners');
  }

  const participantIds = winners as string[];
  const groups: string[][] = [];
  let left = 0;
  let right = participantIds.length - 1;

  if (participantIds.length % 2 === 1) {
    groups.push([
      participantIds[left],
      participantIds[right - 1],
      participantIds[right],
    ]);
    left += 1;
    right -= 2;
  }

  while (left < right) {
    groups.push([participantIds[left], participantIds[right]]);
    left += 1;
    right -= 1;
  }

  return groups.map((group, index) => ({
    id: createId('battle'),
    round: groups.length === 1 ? 'final' : nextRound,
    slot: index + 1,
    participantIds: group,
    participantAId: group[0],
    participantBId: group[1],
    status: 'pending',
  }));
}
