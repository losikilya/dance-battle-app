import type { Battle, BattleVote } from '@domain/battle/types';
import type { Participant } from '@domain/participant/types';

export type BattleParticipantDisplayRow = {
  participantId: string;
  participant: Participant | null;
  name: string;
  voteCount: number;
  isWinner: boolean;
};

export function getBattleParticipantIds(battle: Battle): string[] {
  const participantIds =
    battle.participantIds.length > 0
      ? battle.participantIds
      : [battle.participantAId, battle.participantBId];

  return participantIds.filter(
    (participantId, index) => participantIds.indexOf(participantId) === index,
  );
}

export function getBattleParticipantDisplayRows(params: {
  battle: Battle;
  participants: Participant[];
  votes: BattleVote[];
}): BattleParticipantDisplayRow[] {
  const { battle, participants, votes } = params;
  const battleVotes = votes.filter(vote => vote.battleId === battle.id);

  return getBattleParticipantIds(battle).map((participantId) => {
    const participant =
      participants.find(item => item.id === participantId) ?? null;

    return {
      participantId,
      participant,
      name: participant?.name ?? 'Unknown',
      voteCount: battleVotes.filter(vote => vote.winnerId === participantId)
        .length,
      isWinner: battle.winnerId === participantId,
    };
  });
}

export function formatBattleParticipantNames(
  rows: BattleParticipantDisplayRow[],
): string {
  return rows.map(row => row.name).join(' vs ');
}
