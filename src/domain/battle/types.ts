export type BattleRound = 'top8' | 'semifinal' | 'final';

export type BattleStatus = 'pending' | 'active' | 'voting' | 'finished';

export type Battle = {
  id: string;
  round: BattleRound;
  slot: number;
  participantAId: string;
  participantBId: string;
  winnerId?: string;
  status: BattleStatus;
};

export type BattleVote = {
  id: string;
  battleId: string;
  judgeId: string;
  winnerId: string;
  createdAt: string;
};