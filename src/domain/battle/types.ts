export type BattleRound =
  | 'custom'
  | 'top32'
  | 'top16'
  | 'top8'
  | 'semifinal'
  | 'final';

export type BattleStatus = 'pending' | 'active' | 'voting' | 'finished';

export type Battle = {
  id: string;
  battleConfigurationId?: string;
  round: BattleRound;
  slot: number;
  participantIds: string[];
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
