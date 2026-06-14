import { BattleAppState } from './appState';
import { AppEvent } from './appEvent';

export type ClientRole = 'judge' | 'mc' | 'spectator';

// ── Messages: Judge → Host ─────────────────────────────────────────────────

export type IdentifyMessage = {
  type: 'identify';
  judgeId: string;
  name: string;
  role: ClientRole;
};

export type VoteMessage = {
  type: 'vote';
  battleId: string;
  winnerId: string;
};

export type ScoreMessage = {
  type: 'score';
  participantId: string;
  judgeId: string;
  score: number;
};

export type ClientMessage = IdentifyMessage | VoteMessage | ScoreMessage;

// ── Messages: Host → Judge ─────────────────────────────────────────────────

export type AckMessage = {
  type: 'ack';
  deviceId: string;
};

export type StateSyncMessage = {
  type: 'state_sync';
  state: BattleAppState;
};

export type EventMessage = {
  type: 'event';
  appEvent: AppEvent;
};

export type HostMessage = AckMessage | StateSyncMessage | EventMessage;
