import { Battle, BattleVote } from '../battle/types';
import { QualificationScore } from '../qualification/types';

export type AppEventMeta = {
  id: string;
  createdAt: string;
};

export type QualificationStartedEvent = AppEventMeta & {
  type: 'qualification.started';
  payload: {
    currentParticipantIndex: number;
  };
};

export type QualificationScoreSubmittedEvent = AppEventMeta & {
  type: 'qualification.scoreSubmitted';
  payload: QualificationScore;
};

export type QualificationFinishedEvent = AppEventMeta & {
  type: 'qualification.finished';
  payload: Record<string, never>;
};

export type BracketGeneratedEvent = AppEventMeta & {
  type: 'bracket.generated';
  payload: {
    battles: Battle[];
  };
};

export type BattleStartedEvent = AppEventMeta & {
  type: 'battle.started';
  payload: {
    battleId: string;
  };
};

export type BattleVoteSubmittedEvent = AppEventMeta & {
  type: 'battle.voteSubmitted';
  payload: BattleVote;
};

export type BattleFinishedEvent = AppEventMeta & {
  type: 'battle.finished';
  payload: {
    battleId: string;
    winnerId: string;
  };
};

export type NextRoundGeneratedEvent = AppEventMeta & {
  type: 'nextRound.generated';
  payload: {
    battles: Battle[];
  };
};

export type EventResetEvent = AppEventMeta & {
  type: 'event.reset';
  payload: Record<string, never>;
};

export type QualificationParticipantChangedEvent = AppEventMeta & {
  type: 'qualification.participantChanged';
  payload: {
    participantIndex: number;
  };
};

export type AppEvent =
  | QualificationStartedEvent
  | QualificationScoreSubmittedEvent
  | QualificationFinishedEvent
  | BracketGeneratedEvent
  | BattleStartedEvent
  | BattleVoteSubmittedEvent
  | BattleFinishedEvent
  | NextRoundGeneratedEvent
  | EventResetEvent
  | QualificationParticipantChangedEvent;