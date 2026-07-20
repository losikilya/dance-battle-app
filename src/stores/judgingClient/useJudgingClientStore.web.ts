import { create } from 'zustand';

import type { AppCommand } from '@domain/commands/command';
import type { Battle } from '@domain/battle/types';
import type { Participant } from '@domain/participant/types';
import type { BattleAppState } from '@domain/sync/appState';
import { getQualificationParticipants } from '@domain/sync/stateSelectors';
import type { ClientRole } from '@domain/sync/wsProtocol';
import { getOrCreateClientDeviceId } from '../../infrastructure/storage/clientIdentityRepository';
import { createId } from '../../shared/lib/createId';

type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

export type ConnectParams = {
  address: string;
  role: ClientRole;
  name?: string;
  requestedJudgeId?: string;
};

export type ConnectToHostParams = {
  host: string;
  port: number;
  role: ClientRole;
  name?: string;
  requestedJudgeId?: string;
};

type JudgingClientState = {
  status: ConnectionStatus;
  host: string | null;
  port: number | null;
  serverAddress: string | null;
  deviceId: string;
  assignedJudgeId: string | null;
  assignedJudgeName: string | null;
  syncedState: BattleAppState | null;
  lastError: string | null;
  error: string | null;
  reconnectAttempts: number;
  role: ClientRole | null;
  name: string | null;
  requestedJudgeId: string | null;
  pendingAddress: string | null;
};

type JudgingClientActions = {
  connect: (params: ConnectParams) => void;
  connectToHost: (params: ConnectToHostParams) => void;
  hydrateDeviceId: () => Promise<string>;
  disconnect: () => void;
  sendCommand: (command: AppCommand) => void;
  submitCurrentQualificationScore: (score: number) => void;
  submitBattleVote: (params: {
    battleId: string;
    winnerId: string;
  }) => void;
  pauseQualificationTimer: () => void;
  resumeQualificationTimer: () => void;
  restartQualificationTimer: () => void;
  advanceQualificationParticipant: () => void;
  markCurrentParticipantAbsent: () => void;
  moveCurrentParticipantToEnd: () => void;
  finishQualification: () => void;
  requestSnapshot: () => void;
  sendScore: (params: { participantId: string; score: number }) => void;
  sendVote: (params: { battleId: string; winnerId: string }) => void;
  resetConnectionTarget: () => void;
  setPendingAddress: (address: string | null) => void;
};

type JudgingClientComputed = {
  getCurrentQualificationParticipant: () => Participant | null;
  getActiveBattle: () => Battle | null;
  getParticipantName: (participantId: string) => string;
};

const disconnectedState = {
  status: 'disconnected' as const,
  host: null,
  port: null,
  serverAddress: null,
  assignedJudgeId: null,
  assignedJudgeName: null,
  syncedState: null,
  lastError: null,
  error: null,
  reconnectAttempts: 0,
  role: null,
  name: null,
  requestedJudgeId: null,
  pendingAddress: null,
};

function getPendingQualificationParticipant(
  state: BattleAppState,
  judgeId: string,
): Participant | null {
  const participants = getQualificationParticipants(state);

  return (
    participants.find(
      (participant) =>
        !state.scores.some(
          (score) =>
            score.participantId === participant.id &&
            score.judgeId === judgeId,
        ),
    ) ??
    participants[state.currentQualificationParticipantIndex] ??
    null
  );
}

export const MAX_RECONNECT_ATTEMPTS = 5;

export const useJudgingClientStore = create<
  JudgingClientState & JudgingClientComputed & JudgingClientActions
>((set, get) => {
  const hydrateDeviceId = async (): Promise<string> => {
    const deviceId = await getOrCreateClientDeviceId();
    set({ deviceId });
    return deviceId;
  };

  const connectPreview = ({
    host,
    port,
    role,
    name,
    requestedJudgeId,
  }: ConnectToHostParams): void => {
    void hydrateDeviceId().then(() => {
      set({
        status: 'connected',
        host,
        port,
        serverAddress: `${host}:${port}`,
        role,
        name: name ?? null,
        requestedJudgeId: requestedJudgeId ?? null,
        assignedJudgeId: role === 'judge' ? requestedJudgeId ?? null : null,
        assignedJudgeName: role === 'judge' ? name ?? null : null,
        syncedState: null,
        lastError: 'Web preview uses no TCP connection or Host snapshot',
        error: null,
        reconnectAttempts: 0,
      });
    });
  };

  const setPreviewCommandError = (): void => {
    set({
      lastError: 'Remote commands are disabled in web preview',
      error: 'Remote commands are disabled in web preview',
    });
  };

  return {
    ...disconnectedState,
    deviceId: createId('device'),

    hydrateDeviceId,

    connect: ({ address, role, name, requestedJudgeId }): void => {
      const [host = 'web-preview', portText = '0'] = address.split(':');
      connectPreview({
        host,
        port: Number(portText) || 0,
        role,
        name,
        requestedJudgeId,
      });
    },

    connectToHost: connectPreview,

    disconnect: (): void => {
      set(disconnectedState);
    },

    resetConnectionTarget: (): void => {
      set(disconnectedState);
    },

    sendCommand: setPreviewCommandError,
    submitCurrentQualificationScore: setPreviewCommandError,
    submitBattleVote: setPreviewCommandError,
    pauseQualificationTimer: setPreviewCommandError,
    resumeQualificationTimer: setPreviewCommandError,
    restartQualificationTimer: setPreviewCommandError,
    advanceQualificationParticipant: setPreviewCommandError,
    markCurrentParticipantAbsent: setPreviewCommandError,
    moveCurrentParticipantToEnd: setPreviewCommandError,
    finishQualification: setPreviewCommandError,
    requestSnapshot: setPreviewCommandError,
    sendScore: setPreviewCommandError,
    sendVote: setPreviewCommandError,

    setPendingAddress: (address): void => {
      set({ pendingAddress: address });
    },

    getCurrentQualificationParticipant: (): Participant | null => {
      const { assignedJudgeId, syncedState } = get();

      if (!syncedState) {
        return null;
      }

      if (assignedJudgeId) {
        return getPendingQualificationParticipant(syncedState, assignedJudgeId);
      }

      return (
        getQualificationParticipants(syncedState)[
          syncedState.currentQualificationParticipantIndex
        ] ?? null
      );
    },

    getActiveBattle: (): Battle | null => {
      const syncedState = get().syncedState;

      if (!syncedState?.activeBattleId) {
        return null;
      }

      return (
        syncedState.battles.find(
          (battle) => battle.id === syncedState.activeBattleId,
        ) ?? null
      );
    },

    getParticipantName: (participantId): string =>
      get().syncedState?.participants.find(
        (participant) => participant.id === participantId,
      )?.name ?? 'Unknown',
  };
});
