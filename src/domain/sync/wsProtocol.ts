import type { AppCommand } from '../commands/command';
import type { AppRole } from '../role/types';
import type { AppEvent } from './appEvent';
import type { BattleAppState } from './appState';

export type ClientRole = Exclude<AppRole, 'host'>;

type SyncMessageMeta = {
  messageId: string;
};

export type JoinMessage = SyncMessageMeta & {
  type: 'join';
  deviceId: string;
  role: ClientRole;
  name?: string;
  requestedJudgeId?: string;
};

export type JoinedMessage = SyncMessageMeta & {
  type: 'joined';
  requestMessageId: string;
  assignedJudgeId: string | null;
  snapshot: BattleAppState;
};

export type CommandMessage = SyncMessageMeta & {
  type: 'command';
  command: AppCommand;
};

export type EventsMessage = SyncMessageMeta & {
  type: 'events';
  events: AppEvent[];
};

export type SnapshotMessage = SyncMessageMeta & {
  type: 'snapshot';
  snapshot: BattleAppState;
};

export type SnapshotRequestMessage = SyncMessageMeta & {
  type: 'snapshot.request';
};

export type ErrorMessage = SyncMessageMeta & {
  type: 'error';
  requestMessageId?: string;
  code: string;
  message: string;
};

export type PingMessage = SyncMessageMeta & {
  type: 'ping';
};

export type PongMessage = SyncMessageMeta & {
  type: 'pong';
  requestMessageId: string;
};

export type ClientMessage =
  | JoinMessage
  | CommandMessage
  | SnapshotRequestMessage
  | ErrorMessage
  | PingMessage
  | PongMessage;

export type HostMessage =
  | JoinedMessage
  | EventsMessage
  | SnapshotMessage
  | ErrorMessage
  | PingMessage
  | PongMessage;

export type SyncMessage = ClientMessage | HostMessage;
