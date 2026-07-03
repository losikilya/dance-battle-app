export type QualificationScore = {
  id: string;
  participantId: string;
  judgeId: string;
  score: number;
  createdAt: string;
};

export type QualificationAdvanceMode = 'manual' | 'automatic';

export type QualificationTimerStatus =
  | 'idle'
  | 'running'
  | 'paused'
  | 'expired';

export type QualificationTimerState = {
  status: QualificationTimerStatus;
  participantId: string | null;
  durationSeconds: number;
  endsAt: string | null;
  remainingMsWhenPaused: number | null;
};

export type RankedParticipant = {
  participantId: string;
  rank: number;
  averageScore: number;
  scoresCount: number;
};
