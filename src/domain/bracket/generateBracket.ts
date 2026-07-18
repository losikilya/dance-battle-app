import { Battle, BattleRound } from '../battle/types';
import { BattleFormat } from '../event/types';
import { RankedParticipant } from '../qualification/types';
import { createId } from '../../shared/lib/createId';

const FORMAT_SIZE: Record<BattleFormat, number> = {
  top8: 8,
  top16: 16,
  top32: 32,
};

function createSeedOrder(size: number): number[] {
  let seeds = [1, 2];

  while (seeds.length < size) {
    const nextSize = seeds.length * 2;
    seeds = seeds.flatMap((seed) => [seed, nextSize + 1 - seed]);
  }

  return seeds;
}

export function generateBracket(
  ranking: RankedParticipant[],
  format: BattleFormat,
): Battle[] {
  const size = FORMAT_SIZE[format];
  const qualified = ranking.slice(0, size);

  if (qualified.length < size) {
    throw new Error(
      `${format.toUpperCase()} bracket requires at least ${size} ranked participants`,
    );
  }

  const seeds = createSeedOrder(size);

  return Array.from({ length: size / 2 }, (_, index) => ({
    id: createId('battle'),
    round: format as BattleRound,
    slot: index + 1,
    participantIds: [
      qualified[seeds[index * 2] - 1].participantId,
      qualified[seeds[index * 2 + 1] - 1].participantId,
    ],
    participantAId: qualified[seeds[index * 2] - 1].participantId,
    participantBId: qualified[seeds[index * 2 + 1] - 1].participantId,
    status: 'pending',
  }));
}

function getRoundForParticipantCount(count: number): BattleRound {
  if (count === 2 || count === 3) return 'final';
  if (count <= 6) return 'semifinal';
  if (count <= 8) return 'top8';
  if (count <= 16) return 'top16';
  if (count <= 32) return 'top32';
  return 'custom';
}

function createBattleGroups(participantIds: string[]): string[][] {
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

  return groups;
}

export function generateBracketFromParticipantIds(
  participantIds: string[],
): Battle[] {
  if (participantIds.length < 2) {
    throw new Error('Bracket requires at least 2 participants');
  }

  const round = getRoundForParticipantCount(participantIds.length);
  const groups = createBattleGroups(participantIds);

  return groups.map((group, index) => ({
    id: createId('battle'),
    round,
    slot: index + 1,
    participantIds: group,
    participantAId: group[0],
    participantBId: group[1],
    status: 'pending',
  }));
}
