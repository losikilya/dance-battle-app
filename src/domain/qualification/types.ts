export type QualificationScore = {
  id: string;
  participantId: string;
  judgeId: string;
  score: number;
  createdAt: string;
};

export type RankedParticipant = {
  participantId: string;
  rank: number;
  averageScore: number;
  scoresCount: number;
};