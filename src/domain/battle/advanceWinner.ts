import { Battle } from './types';
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
      participantAId: winners[0] as string,
      participantBId: winners[1] as string,
      status: 'pending',
    },
    {
      id: createId('battle'),
      round: 'semifinal',
      slot: 2,
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
    participantAId: winners[0] as string,
    participantBId: winners[1] as string,
    status: 'pending',
  };
}