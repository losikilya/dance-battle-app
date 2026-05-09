import { Battle } from '../battle/types';
import { RankedParticipant } from '../qualification/types';
import { createId } from '../../shared/lib/createId';

const TOP_8_PAIRS = [
  [0, 7],
  [3, 4],
  [1, 6],
  [2, 5],
] as const;

export function generateTop8Bracket(ranking: RankedParticipant[]): Battle[] {
  const top8 = ranking.slice(0, 8);

  if (top8.length < 8) {
    throw new Error('Top 8 bracket requires at least 8 ranked participants');
  }

  return TOP_8_PAIRS.map(([participantAIndex, participantBIndex], index) => ({
    id: createId('battle'),
    round: 'top8',
    slot: index + 1,
    participantAId: top8[participantAIndex].participantId,
    participantBId: top8[participantBIndex].participantId,
    status: 'pending',
  }));
}