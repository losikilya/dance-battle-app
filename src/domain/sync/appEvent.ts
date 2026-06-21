import { Battle, BattleVote } from '../battle/types';
import { DanceEvent } from '../event/types';
import { Judge } from '../judge/types';
import { Participant, CheckInStatus } from '../participant/types';
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

export type BattleVotingOpenedEvent = AppEventMeta & {
  type: 'battle.votingOpened';
  payload: { battleId: string };
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

export type EventCreatedEvent = AppEventMeta & {
  type: 'event.created';
  payload: {
    event: DanceEvent;
    judges: Judge[];
  };
};

export type ParticipantAddedEvent = AppEventMeta & {
  type: 'participant.added';
  payload: {
    participant: Participant;
  };
};

export type ParticipantRemovedEvent = AppEventMeta & {
  type: 'participant.removed';
  payload: { participantId: string };
};

export type ParticipantCheckInToggledEvent = AppEventMeta & {
  type: 'participant.checkInToggled';
  payload: { participantId: string; checkIn: CheckInStatus };
};

export type AppEvent =
  | QualificationStartedEvent
  | QualificationScoreSubmittedEvent
  | QualificationFinishedEvent
  | BracketGeneratedEvent
  | BattleStartedEvent
  | BattleVoteSubmittedEvent
  | BattleFinishedEvent
  | BattleVotingOpenedEvent
  | NextRoundGeneratedEvent
  | EventResetEvent
  | QualificationParticipantChangedEvent
  | EventCreatedEvent
  | ParticipantAddedEvent
  | ParticipantRemovedEvent
  | ParticipantCheckInToggledEvent;