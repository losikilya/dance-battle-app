import TcpSocket from 'react-native-tcp-socket';
import type { Socket as TcpSocketSocket } from 'react-native-tcp-socket';
import { create } from 'zustand';

import type { AppCommand } from '@domain/commands/command';
import { createCommand } from '@domain/commands/createCommand';
import type { Battle } from '@domain/battle/types';
import type { Participant } from '@domain/participant/types';
import { applyEvent } from '@domain/sync/applyEvent';
import type { BattleAppState } from '@domain/sync/appState';
import { getQualificationParticipants } from '@domain/sync/stateSelectors';
import type {
  ClientMessage,
  ClientRole,
  HostMessage,
} from '@domain/sync/wsProtocol';
import {
  parseManualAddress,
  type ParsedHostAddress,
} from '../../infrastructure/network/connectionAddress';
import { createId } from '../../shared/lib/createId';

type TcpModule = typeof TcpSocket & {
  createConnection: (
    options: { host: string; port: number },
    callback: () => void,
  ) => TcpSocketSocket;
};

const createTcpConnection = (
  options: { host: string; port: number },
  callback: () => void,
): TcpSocketSocket =>
  (TcpSocket as TcpModule).createConnection(options, callback);

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
  finishQualification: () => void;
  generateBracket: (participantIds: string[]) => void;
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

type UnknownMessage = {
  type?: unknown;
  messageId?: unknown;
};

export const MAX_RECONNECT_ATTEMPTS = 5;
const CONNECT_TIMEOUT_MS = 10000;

const localDeviceId = createId('device');
let clientSocket: TcpSocketSocket | null = null;
let reconnectAttempts = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let connectTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
const intentionallyClosedSockets = new WeakSet<TcpSocketSocket>();

function isMessageObject(value: unknown): value is UnknownMessage {
  return typeof value === 'object' && value !== null;
}

function getAssignedJudgeName(
  state: BattleAppState,
  assignedJudgeId: string | null,
): string | null {
  if (!assignedJudgeId) {
    return null;
  }

  return (
    state.judges.find((judge) => judge.id === assignedJudgeId)?.name ?? null
  );
}

function getPendingQualificationParticipant(
  state: BattleAppState,
  judgeId: string,
): Participant | null {
  const currentIndex = state.currentQualificationParticipantIndex;
  const participants = getQualificationParticipants(state);

  for (let index = 0; index <= currentIndex; index += 1) {
    const participant = participants[index];

    if (
      participant &&
      !state.scores.some(
        score =>
          score.participantId === participant.id && score.judgeId === judgeId,
      )
    ) {
      return participant;
    }
  }

  return participants[currentIndex] ?? null;
}

export const useJudgingClientStore = create<
  JudgingClientState & JudgingClientComputed & JudgingClientActions
>((set, get) => {
  const clearReconnectTimer = (): void => {
    if (reconnectTimer !== null) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  const clearConnectTimeout = (): void => {
    if (connectTimeoutTimer !== null) {
      clearTimeout(connectTimeoutTimer);
      connectTimeoutTimer = null;
    }
  };

  const closeClientSocket = (): void => {
    clearConnectTimeout();

    if (clientSocket !== null) {
      intentionallyClosedSockets.add(clientSocket);
      clientSocket.destroy();
      clientSocket = null;
    }
  };

  const writeMessage = (message: ClientMessage): void => {
    if (clientSocket && !clientSocket.destroyed) {
      clientSocket.write(`${JSON.stringify(message)}\n`);
    }
  };

  const sendProtocolError = (
    code: string,
    message: string,
    requestMessageId?: string,
  ): void => {
    writeMessage({
      type: 'error',
      messageId: createId('message'),
      requestMessageId,
      code,
      message,
    });
  };

  const handleMessage = (rawMessage: unknown): void => {
    if (!isMessageObject(rawMessage) || typeof rawMessage.type !== 'string') {
      sendProtocolError('invalid_message', 'Message must have a type');
      return;
    }

    const messageId =
      typeof rawMessage.messageId === 'string'
        ? rawMessage.messageId
        : undefined;

    if (!messageId) {
      sendProtocolError('invalid_message', 'Message must have a messageId');
      return;
    }

    const message = rawMessage as HostMessage;

    switch (message.type) {
      case 'joined':
        console.log('[judging-client] joined received');
        set({
          status: 'connected',
          role: message.assignedRole,
          assignedJudgeId: message.assignedJudgeId,
          assignedJudgeName: getAssignedJudgeName(
            message.snapshot,
            message.assignedJudgeId,
          ),
          syncedState: message.snapshot,
          lastError: null,
          error: null,
          reconnectAttempts: 0,
        });
        reconnectAttempts = 0;
        return;

      case 'events':
        set((state) => {
          const nextSyncedState = state.syncedState
            ? message.events.reduce(
                (currentState, event) => applyEvent(currentState, event),
                state.syncedState,
              )
            : null;
          const nextError =
            nextSyncedState === null
              ? 'Received events before initial snapshot'
              : null;

          return {
            syncedState: nextSyncedState,
            assignedJudgeName: nextSyncedState
              ? getAssignedJudgeName(
                  nextSyncedState,
                  state.assignedJudgeId,
                )
              : state.assignedJudgeName,
            lastError: nextError,
            error: nextError,
          };
        });
        return;

      case 'snapshot':
        set((state) => ({
          syncedState: message.snapshot,
          assignedJudgeName: getAssignedJudgeName(
            message.snapshot,
            state.assignedJudgeId,
          ),
          lastError: null,
          error: null,
        }));
        return;

      case 'error':
        set({ lastError: message.message, error: message.message });
        return;

      case 'ping':
        writeMessage({
          type: 'pong',
          messageId: createId('message'),
          requestMessageId: message.messageId,
        });
        return;

      case 'pong':
        return;

      default:
        sendProtocolError(
          'unknown_message',
          `Unsupported message type: ${(message as UnknownMessage).type}`,
          messageId,
        );
    }
  };

  const scheduleReconnect = (): void => {
    if (reconnectTimer !== null) {
      return;
    }

    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      set({
        status: 'error',
        lastError: 'Maximum reconnect attempts reached',
        error: 'Maximum reconnect attempts reached',
        reconnectAttempts,
      });
      return;
    }

    reconnectAttempts += 1;
    console.log('[judging-client] reconnect attempt', reconnectAttempts);
    set({ status: 'reconnecting', reconnectAttempts });

    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;

      const {
        serverAddress,
        role,
        name,
        requestedJudgeId,
      } = get();

      if (serverAddress && role) {
        const parsedAddress = parseManualAddress(serverAddress);
        connectToParsedAddress(
          parsedAddress.ok ? parsedAddress.value : null,
          {
            role: 'spectator',
            name: name ?? undefined,
            requestedJudgeId: requestedJudgeId ?? undefined,
          },
          true,
        );
      }
    }, 3000);
  };

  const connectToParsedAddress = (
    parsedAddress: ParsedHostAddress | null,
    params: {
      role: ClientRole;
      name?: string;
      requestedJudgeId?: string;
    },
    isReconnect: boolean,
  ): void => {
    if (parsedAddress === null) {
      set({
        status: 'error',
        lastError: 'Server address must use the format host:port',
        error: 'Server address must use the format host:port',
      });
      return;
    }

    if (!isReconnect) {
      clearReconnectTimer();
      reconnectAttempts = 0;
    }

    closeClientSocket();

    const { host, port, address } = parsedAddress;
    console.log('[judging-client] connect attempt', { host, port });

    set((state) => ({
      status: isReconnect ? 'reconnecting' : 'connecting',
      host,
      port,
      serverAddress: address,
      role: params.role,
      name: params.name ?? null,
      requestedJudgeId: params.requestedJudgeId ?? null,
      assignedJudgeId: null,
      assignedJudgeName: null,
      syncedState: isReconnect ? state.syncedState : null,
      lastError: isReconnect ? state.lastError : null,
      error: isReconnect ? state.error : null,
      reconnectAttempts,
    }));

    let buffer = '';
    let socket: TcpSocketSocket;
    socket = createTcpConnection({ host, port }, () => {
      clearConnectTimeout();
      console.log('[judging-client] connected');

      if (!socket.destroyed) {
        const joinMessage: ClientMessage = {
          type: 'join',
          messageId: createId('message'),
          deviceId: get().deviceId,
          role: params.role,
          name: params.name,
          requestedJudgeId: params.requestedJudgeId,
        };
        socket.write(`${JSON.stringify(joinMessage)}\n`);
        console.log('[judging-client] join sent');
      }
    });
    clientSocket = socket;

    connectTimeoutTimer = setTimeout(() => {
      if (clientSocket !== socket || socket.destroyed) {
        return;
      }

      const message = `Connection timed out after ${CONNECT_TIMEOUT_MS / 1000}s`;
      console.log('[judging-client] timeout', { host, port });
      set({ lastError: message, error: message });
      socket.destroy();
      scheduleReconnect();
    }, CONNECT_TIMEOUT_MS);

    socket.on('data', (data: Buffer | string) => {
      buffer += data.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      lines.filter(Boolean).forEach((line) => {
        try {
          handleMessage(JSON.parse(line) as unknown);
        } catch (error) {
          sendProtocolError(
            'invalid_json',
            error instanceof Error ? error.message : 'Invalid JSON message',
          );
        }
      });
    });

    socket.on('close', () => {
      clearConnectTimeout();
      if (intentionallyClosedSockets.has(socket)) {
        intentionallyClosedSockets.delete(socket);
        return;
      }

      if (clientSocket === socket) {
        clientSocket = null;
      }
      scheduleReconnect();
    });

    socket.on('error', (error: Error & { code?: string }) => {
      clearConnectTimeout();
      const message = error.code
        ? `${error.code}: ${error.message}`
        : error.message;
      console.log('[judging-client] connection error', message);
      set({ lastError: message, error: message });
      scheduleReconnect();
    });
  };

  const sendCommand = (command: AppCommand): void => {
    if (
      get().status !== 'connected' ||
      clientSocket === null ||
      clientSocket.destroyed
    ) {
      set({
        lastError: 'Client is not connected to the Host',
        error: 'Client is not connected to the Host',
      });
      return;
    }

    writeMessage({
      type: 'command',
      messageId: createId('message'),
      command: {
        ...command,
        authorDeviceId: get().deviceId,
      },
    });
  };

  return {
    status: 'disconnected',
    host: null,
    port: null,
    serverAddress: null,
    deviceId: localDeviceId,
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

    getCurrentQualificationParticipant: (): Participant | null => {
      const { assignedJudgeId, syncedState } = get();

      if (!syncedState) {
        return null;
      }

      if (assignedJudgeId) {
        return getPendingQualificationParticipant(
          syncedState,
          assignedJudgeId,
        );
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

    getParticipantName: (participantId): string => {
      const syncedState = get().syncedState;

      return (
        syncedState?.participants.find(
          (participant) => participant.id === participantId,
        )?.name ?? 'Unknown'
      );
    },

    connect: ({ address, role, name, requestedJudgeId }): void => {
      const parsedAddress = parseManualAddress(address);

      if (!parsedAddress.ok) {
        set({
          status: 'error',
          lastError: parsedAddress.error,
          error: parsedAddress.error,
        });
        return;
      }

      connectToParsedAddress(parsedAddress.value, {
        role,
        name: name ?? undefined,
        requestedJudgeId: requestedJudgeId ?? undefined,
      }, false);
    },

    connectToHost: ({ host, port, role, name, requestedJudgeId }): void => {
      get().connect({
        address: `${host}:${port}`,
        role,
        name,
        requestedJudgeId,
      });
    },

    disconnect: (): void => {
      clearReconnectTimer();
      closeClientSocket();

      reconnectAttempts = 0;
      set({
        status: 'disconnected',
        assignedJudgeId: null,
        assignedJudgeName: null,
        syncedState: null,
        lastError: null,
        error: null,
        reconnectAttempts: 0,
      });
    },

    resetConnectionTarget: (): void => {
      clearReconnectTimer();
      closeClientSocket();

      reconnectAttempts = 0;
      set({
        status: 'disconnected',
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
      });
    },

    sendCommand,

    submitCurrentQualificationScore: (score): void => {
      const { assignedJudgeId, syncedState } = get();

      if (!assignedJudgeId) {
        set({
          lastError: 'Host has not assigned a judge identity',
          error: 'Host has not assigned a judge identity',
        });
        return;
      }

      if (!syncedState) {
        set({
          lastError: 'Initial Host snapshot has not been received',
          error: 'Initial Host snapshot has not been received',
        });
        return;
      }

      const participant = getPendingQualificationParticipant(
        syncedState,
        assignedJudgeId,
      );

      if (!participant) {
        set({
          lastError: 'Current qualification participant was not found',
          error: 'Current qualification participant was not found',
        });
        return;
      }

      sendCommand(
        createCommand('qualification.submitScore', {
          participantId: participant.id,
          judgeId: assignedJudgeId,
          score,
        }),
      );
    },

    submitBattleVote: ({ battleId, winnerId }): void => {
      const judgeId = get().assignedJudgeId;

      if (!judgeId) {
        set({
          lastError: 'Host has not assigned a judge identity',
          error: 'Host has not assigned a judge identity',
        });
        return;
      }

      sendCommand(
        createCommand('battle.submitVote', {
          battleId,
          judgeId,
          winnerId,
        }),
      );
    },

    pauseQualificationTimer: (): void => {
      sendCommand(createCommand('qualification.timer.pause', {}));
    },

    resumeQualificationTimer: (): void => {
      sendCommand(createCommand('qualification.timer.resume', {}));
    },

    restartQualificationTimer: (): void => {
      sendCommand(createCommand('qualification.timer.restart', {}));
    },

    advanceQualificationParticipant: (): void => {
      sendCommand(
        createCommand('qualification.advanceParticipant', {
          reason: 'manual',
        }),
      );
    },

    finishQualification: (): void => {
      sendCommand(createCommand('qualification.finish', {}));
    },

    generateBracket: (participantIds): void => {
      sendCommand(createCommand('bracket.generate', { participantIds }));
    },

    requestSnapshot: (): void => {
      if (
        get().status !== 'connected' ||
        clientSocket === null ||
        clientSocket.destroyed
      ) {
        set({
          lastError: 'Client is not connected to the Host',
          error: 'Client is not connected to the Host',
        });
        return;
      }

      writeMessage({
        type: 'snapshot.request',
        messageId: createId('message'),
      });
    },

    sendScore: ({ participantId, score }): void => {
      const judgeId = get().assignedJudgeId;
      if (!judgeId) {
        set({
          lastError: 'Host has not assigned a judge identity',
          error: 'Host has not assigned a judge identity',
        });
        return;
      }

      sendCommand(
        createCommand('qualification.submitScore', {
          participantId,
          judgeId,
          score,
        }),
      );
    },

    sendVote: ({ battleId, winnerId }): void => {
      get().submitBattleVote({ battleId, winnerId });
    },

    setPendingAddress: (address): void => {
      set({ pendingAddress: address });
    },
  };
});
