export type CommandMeta = {
  id: string;
  createdAt: string;
  authorDeviceId?: string;
};

export type StartQualificationCommand = CommandMeta & {
  type: 'qualification.start';
  payload: Record<string, never>;
};

export type SubmitQualificationScoreCommand = CommandMeta & {
  type: 'qualification.submitScore';
  payload: {
    participantId: string;
    judgeId: string;
    score: number;
  };
};

export type GoToNextQualificationParticipantCommand = CommandMeta & {
  type: 'qualification.goToNextParticipant';
  payload: Record<string, never>;
};

export type FinishQualificationCommand = CommandMeta & {
  type: 'qualification.finish';
  payload: Record<string, never>;
};

export type GenerateTop8Command = CommandMeta & {
  type: 'bracket.generateTop8';
  payload: Record<string, never>;
};

export type StartBattleCommand = CommandMeta & {
  type: 'battle.start';
  payload: {
    battleId: string;
  };
};

export type SubmitBattleVoteCommand = CommandMeta & {
  type: 'battle.submitVote';
  payload: {
    battleId: string;
    judgeId: string;
    winnerId: string;
  };
};

export type GenerateNextRoundCommand = CommandMeta & {
  type: 'battle.generateNextRound';
  payload: Record<string, never>;
};

export type ResetEventCommand = CommandMeta & {
  type: 'event.reset';
  payload: Record<string, never>;
};

export type AppCommand =
  | StartQualificationCommand
  | SubmitQualificationScoreCommand
  | GoToNextQualificationParticipantCommand
  | FinishQualificationCommand
  | GenerateTop8Command
  | StartBattleCommand
  | SubmitBattleVoteCommand
  | GenerateNextRoundCommand
  | ResetEventCommand;

/**
 * UI
  ↓
Zustand action
  ↓
Command
  ↓
handleCommand
  ↓
AppEvent[]
  ↓
applyEvent
  ↓
eventLog
 */