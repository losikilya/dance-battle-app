import { Battle, BattleVote } from '../battle/types';
import { BattleConfiguration, DanceEvent } from '../event/types';
import { Judge } from '../judge/types';
import { Participant, CheckInStatus } from '../participant/types';
import {
  QualificationScore,
  QualificationTimerState,
} from '../qualification/types';

export type AppEventMeta = {
  id: string;
  createdAt: string;
};

export type QualificationStartedEvent = AppEventMeta & {
  type: 'qualification.started';
  payload: {
    currentParticipantIndex: number;
    timer: QualificationTimerState;
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
    format: BattleConfiguration['format'];
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
    timer?: QualificationTimerState;
  };
};

export type QualificationParticipantAdvancedEvent = AppEventMeta & {
  type: 'qualification.participantAdvanced';
  payload: {
    participantIndex: number;
    reason: 'manual' | 'automatic';
    timer: QualificationTimerState;
  };
};

export type QualificationTimerPausedEvent = AppEventMeta & {
  type: 'qualification.timerPaused';
  payload: {
    timer: QualificationTimerState;
  };
};

export type QualificationTimerResumedEvent = AppEventMeta & {
  type: 'qualification.timerResumed';
  payload: {
    timer: QualificationTimerState;
  };
};

export type QualificationTimerRestartedEvent = AppEventMeta & {
  type: 'qualification.timerRestarted';
  payload: {
    timer: QualificationTimerState;
  };
};

export type QualificationTimerExpiredEvent = AppEventMeta & {
  type: 'qualification.timerExpired';
  payload: {
    timer: QualificationTimerState;
  };
};

export type EventCreatedEvent = AppEventMeta & {
  type: 'event.created';
  payload: {
    event: DanceEvent;
  };
};

export type EventFinishedEvent = AppEventMeta & {
  type: 'event.finished';
  payload: Record<string, never>;
};

export type BattleConfiguredEvent = AppEventMeta & {
  type: 'battle.configured';
  payload: {
    configuration: BattleConfiguration;
  };
};

export type BattleJudgeAssignedEvent = AppEventMeta & {
  type: 'battle.judgeAssigned';
  payload: {
    battleConfigurationId: string;
    judge: Judge;
  };
};

export type BattleJudgeUnassignedEvent = AppEventMeta & {
  type: 'battle.judgeUnassigned';
  payload: {
    battleConfigurationId: string;
    judgeId: string;
    deviceId: string;
  };
};

export type BattleJudgeRenamedEvent = AppEventMeta & {
  type: 'battle.judgeRenamed';
  payload: {
    judgeId: string;
    name: string;
  };
};

export type BattleConfigurationSelectedEvent = AppEventMeta & {
  type: 'battle.configurationSelected';
  payload: {
    battleConfigurationId: string;
  };
};

export type BattleConfigurationDeletedEvent = AppEventMeta & {
  type: 'battle.configurationDeleted';
  payload: {
    battleConfigurationId: string;
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
  | QualificationParticipantAdvancedEvent
  | QualificationTimerPausedEvent
  | QualificationTimerResumedEvent
  | QualificationTimerRestartedEvent
  | QualificationTimerExpiredEvent
  | EventCreatedEvent
  | EventFinishedEvent
  | BattleConfiguredEvent
  | BattleJudgeAssignedEvent
  | BattleJudgeUnassignedEvent
  | BattleJudgeRenamedEvent
  | BattleConfigurationSelectedEvent
  | BattleConfigurationDeletedEvent
  | ParticipantAddedEvent
  | ParticipantRemovedEvent
  | ParticipantCheckInToggledEvent;
