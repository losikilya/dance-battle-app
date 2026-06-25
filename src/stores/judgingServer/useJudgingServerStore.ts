import * as Network from 'expo-network';
import TcpSocket, {
  Socket as TcpSocketSocket,
} from 'react-native-tcp-socket';
import { create } from 'zustand';

import type { AppCommand } from '@domain/commands/command';
import type {
  ClientMessage,
  ClientRole,
  HostMessage,
  JoinMessage,
} from '@domain/sync/wsProtocol';
import { createId } from '../../shared/lib/createId';
import { useDemoBattleStore } from '../demoBattle/useDemoBattleStore';
import { useSessionStore } from '../session/useSessionStore';

export type ConnectedClient = {
  deviceId: string;
  judgeId: string | null;
  name: string;
  role: ClientRole;
  isOnline: boolean;
};

export type ServerStatus = 'idle' | 'running' | 'error';

export type HostConnectionInfo = {
  host: string;
  port: number;
  address: string;
};

type JudgingServerState = {
  status: ServerStatus;
  hostIp: string | null;
  localIp: string | null;
  port: number;
  connectedClients: ConnectedClient[];
  lastError: string | null;
  error: string | null;
  connectionInfo: HostConnectionInfo | null;
};

type JudgingServerActions = {
  startServer: () => Promise<void>;
  stopServer: () => void;
  restartServer: () => Promise<void>;
  broadcastState: () => void;
};

type UnknownMessage = {
  type?: unknown;
  messageId?: unknown;
};

let tcpServer: ReturnType<typeof TcpSocket.createServer> | null = null;
const clientSockets = new Map<string, TcpSocketSocket>();
let unsubscribeFromEventLog: (() => void) | null = null;
let lastBroadcastEventIndex = 0;

function getBattleSnapshot() {
  const {
    event,
    participants,
    judges,
    scores,
    battles,
    votes,
    currentQualificationParticipantIndex,
    activeBattleId,
    systemLogs,
  } = useDemoBattleStore.getState();

  return {
    event,
    participants,
    judges,
    scores,
    battles,
    votes,
    currentQualificationParticipantIndex,
    activeBattleId,
    systemLogs,
  };
}

function isClientRole(value: unknown): value is ClientRole {
  return value === 'judge' || value === 'mc' || value === 'spectator';
}

function isMessageObject(value: unknown): value is UnknownMessage {
  return typeof value === 'object' && value !== null;
}

function getRequestMessageId(message: UnknownMessage): string | undefined {
  return typeof message.messageId === 'string' ? message.messageId : undefined;
}

function isCommandLike(value: unknown): value is AppCommand {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const command = value as Partial<AppCommand>;
  return (
    typeof command.id === 'string' &&
    typeof command.type === 'string' &&
    typeof command.createdAt === 'string' &&
    typeof command.payload === 'object' &&
    command.payload !== null
  );
}

export const useJudgingServerStore = create<
  JudgingServerState & JudgingServerActions
>((set, get) => {
  const writeMessage = (
    socket: TcpSocketSocket,
    message: HostMessage,
  ): void => {
    if (!socket.destroyed) {
      socket.write(`${JSON.stringify(message)}\n`);
    }
  };

  const sendError = (
    socket: TcpSocketSocket,
    code: string,
    message: string,
    requestMessageId?: string,
  ): void => {
    writeMessage(socket, {
      type: 'error',
      messageId: createId('message'),
      requestMessageId,
      code,
      message,
    });
  };

  const sendToClient = (deviceId: string, message: HostMessage): void => {
    const socket = clientSockets.get(deviceId);

    if (socket) {
      writeMessage(socket, message);
    }
  };

  const broadcastMessage = (message: HostMessage): void => {
    get()
      .connectedClients.filter((client) => client.isOnline)
      .forEach((client) => sendToClient(client.deviceId, message));
  };

  const stopEventLogBroadcasting = (): void => {
    unsubscribeFromEventLog?.();
    unsubscribeFromEventLog = null;
  };

  const startEventLogBroadcasting = (): void => {
    stopEventLogBroadcasting();
    lastBroadcastEventIndex =
      useDemoBattleStore.getState().eventLog.length;

    unsubscribeFromEventLog = useDemoBattleStore.subscribe(
      (state, previousState) => {
        if (state.eventLog === previousState.eventLog) {
          return;
        }

        const previousLastBroadcastEvent =
          previousState.eventLog[lastBroadcastEventIndex - 1];
        const currentLastBroadcastEvent =
          state.eventLog[lastBroadcastEventIndex - 1];
        const eventLogPrefixChanged =
          lastBroadcastEventIndex > 0 &&
          previousLastBroadcastEvent?.id !== currentLastBroadcastEvent?.id;

        if (
          state.eventLog.length < lastBroadcastEventIndex ||
          eventLogPrefixChanged
        ) {
          lastBroadcastEventIndex = state.eventLog.length;
          broadcastMessage({
            type: 'snapshot',
            messageId: createId('message'),
            snapshot: getBattleSnapshot(),
          });
          return;
        }

        if (state.eventLog.length === lastBroadcastEventIndex) {
          broadcastMessage({
            type: 'snapshot',
            messageId: createId('message'),
            snapshot: getBattleSnapshot(),
          });
          return;
        }

        const newEvents = state.eventLog.slice(lastBroadcastEventIndex);
        lastBroadcastEventIndex = state.eventLog.length;

        if (newEvents.length === 0) {
          return;
        }

        if (newEvents.some((event) => event.type === 'event.reset')) {
          broadcastMessage({
            type: 'snapshot',
            messageId: createId('message'),
            snapshot: getBattleSnapshot(),
          });
          return;
        }

        broadcastMessage({
          type: 'events',
          messageId: createId('message'),
          events: newEvents,
        });
      },
    );
  };

  const assignJudgeId = (
    deviceId: string,
    requestedJudgeId?: string,
  ): string | null => {
    const judges = useDemoBattleStore.getState().judges;
    const session = useSessionStore.getState();
    const selfJudgeId = session.hasRole('judge')
      ? session.selfJudgeId
      : null;
    const existingClient = get().connectedClients.find(
      (client) => client.deviceId === deviceId,
    );

    if (
      existingClient?.judgeId &&
      judges.some((judge) => judge.id === existingClient.judgeId)
    ) {
      return existingClient.judgeId;
    }

    const assignedJudgeIds = new Set(
      get()
        .connectedClients.filter(
          (client) =>
            client.deviceId !== deviceId &&
            client.role === 'judge' &&
            client.isOnline &&
            client.judgeId !== null,
        )
        .map((client) => client.judgeId as string),
    );

    if (selfJudgeId) {
      assignedJudgeIds.add(selfJudgeId);
    }

    if (
      requestedJudgeId &&
      judges.some((judge) => judge.id === requestedJudgeId) &&
      !assignedJudgeIds.has(requestedJudgeId)
    ) {
      return requestedJudgeId;
    }

    return (
      judges.find((judge) => !assignedJudgeIds.has(judge.id))?.id ?? null
    );
  };

  const registerClient = (
    socket: TcpSocketSocket,
    message: JoinMessage,
  ): string | null => {
    if (
      typeof message.deviceId !== 'string' ||
      message.deviceId.trim().length === 0 ||
      !isClientRole(message.role) ||
      (message.name !== undefined && typeof message.name !== 'string') ||
      (message.requestedJudgeId !== undefined &&
        typeof message.requestedJudgeId !== 'string')
    ) {
      sendError(
        socket,
        'invalid_join',
        'Join message has an invalid device or role',
        message.messageId,
      );
      return null;
    }

    const deviceId = message.deviceId.trim();
    const assignedJudgeId =
      message.role === 'judge'
        ? assignJudgeId(deviceId, message.requestedJudgeId)
        : null;

    if (message.role === 'judge' && assignedJudgeId === null) {
      sendError(
        socket,
        'judge_unavailable',
        'No Host judge is available for this device',
        message.messageId,
      );
      return null;
    }

    const previousSocket = clientSockets.get(deviceId);
    if (previousSocket && previousSocket !== socket) {
      previousSocket.destroy();
    }
    clientSockets.set(deviceId, socket);

    const client: ConnectedClient = {
      deviceId,
      judgeId: assignedJudgeId,
      name: message.name?.trim() || 'Unknown',
      role: message.role,
      isOnline: true,
    };

    set((state) => {
      const exists = state.connectedClients.some(
        (item) => item.deviceId === client.deviceId,
      );

      return {
        connectedClients: exists
          ? state.connectedClients.map((item) =>
              item.deviceId === client.deviceId ? client : item,
            )
          : [...state.connectedClients, client],
      };
    });

    writeMessage(socket, {
      type: 'joined',
      messageId: createId('message'),
      requestMessageId: message.messageId,
      assignedJudgeId,
      snapshot: getBattleSnapshot(),
    });

    return deviceId;
  };

  const handleCommandMessage = async (
    socket: TcpSocketSocket,
    deviceId: string | null,
    message: ClientMessage & { type: 'command' },
  ): Promise<void> => {
    const client = deviceId
      ? get().connectedClients.find(
          (item) => item.deviceId === deviceId && item.isOnline,
        )
      : undefined;

    if (!client) {
      sendError(
        socket,
        'not_joined',
        'Client must join before sending commands',
        message.messageId,
      );
      return;
    }

    if (!isCommandLike(message.command)) {
      sendError(
        socket,
        'invalid_command',
        'Command message is malformed',
        message.messageId,
      );
      return;
    }

    if (client.role !== 'judge' || client.judgeId === null) {
      sendError(
        socket,
        'action_not_allowed',
        'This client role cannot send commands',
        message.messageId,
      );
      return;
    }

    const command = message.command;
    const isJudgeCommand =
      command.type === 'qualification.submitScore' ||
      command.type === 'battle.submitVote';

    if (!isJudgeCommand || command.payload.judgeId !== client.judgeId) {
      sendError(
        socket,
        'judge_identity_mismatch',
        'Command does not use the judge assigned to this connection',
        message.messageId,
      );
      return;
    }

    try {
      const result = await useDemoBattleStore
        .getState()
        .executeRemoteCommand({
          ...command,
          authorDeviceId: client.deviceId,
        });

      if (result.error) {
        sendError(
          socket,
          result.error.code,
          result.error.message,
          message.messageId,
        );
        return;
      }
    } catch (error) {
      sendError(
        socket,
        'command_failed',
        error instanceof Error ? error.message : 'Command execution failed',
        message.messageId,
      );
    }
  };

  const handleClientMessage = async (
    socket: TcpSocketSocket,
    deviceId: string | null,
    rawMessage: unknown,
  ): Promise<string | null> => {
    if (!isMessageObject(rawMessage) || typeof rawMessage.type !== 'string') {
      sendError(socket, 'invalid_message', 'Message must have a type');
      return deviceId;
    }

    const requestMessageId = getRequestMessageId(rawMessage);
    if (!requestMessageId) {
      sendError(socket, 'invalid_message', 'Message must have a messageId');
      return deviceId;
    }

    switch (rawMessage.type) {
      case 'join':
        return registerClient(socket, rawMessage as JoinMessage) ?? deviceId;

      case 'command':
        await handleCommandMessage(
          socket,
          deviceId,
          rawMessage as ClientMessage & { type: 'command' },
        );
        return deviceId;

      case 'snapshot.request':
        writeMessage(socket, {
          type: 'snapshot',
          messageId: createId('message'),
          snapshot: getBattleSnapshot(),
        });
        return deviceId;

      case 'ping':
        writeMessage(socket, {
          type: 'pong',
          messageId: createId('message'),
          requestMessageId,
        });
        return deviceId;

      case 'pong':
      case 'error':
        return deviceId;

      default:
        sendError(
          socket,
          'unknown_message',
          `Unsupported message type: ${rawMessage.type}`,
          requestMessageId,
        );
        return deviceId;
    }
  };

  const onClientConnect = (socket: TcpSocketSocket): void => {
    let buffer = '';
    let joinedDeviceId: string | null = null;
    let processingQueue: Promise<void> = Promise.resolve();

    socket.on('data', (data: Buffer | string) => {
      buffer += data.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      lines.filter(Boolean).forEach((line) => {
        processingQueue = processingQueue.then(async () => {
          try {
            const nextDeviceId = await handleClientMessage(
              socket,
              joinedDeviceId,
              JSON.parse(line) as unknown,
            );
            joinedDeviceId = nextDeviceId;
          } catch (error) {
            sendError(
              socket,
              'invalid_json',
              error instanceof Error ? error.message : 'Invalid JSON message',
            );
          }
        });
      });
    });

    const markOffline = (): void => {
      if (
        joinedDeviceId &&
        clientSockets.get(joinedDeviceId) === socket
      ) {
        clientSockets.delete(joinedDeviceId);
        set((state) => ({
          connectedClients: state.connectedClients.map((client) =>
            client.deviceId === joinedDeviceId
              ? { ...client, isOnline: false }
              : client,
          ),
        }));
      }
    };

    socket.on('close', markOffline);
    socket.on('error', markOffline);
  };

  return {
    status: 'idle',
    hostIp: null,
    localIp: null,
    port: 8080,
    connectedClients: [],
    lastError: null,
    error: null,
    connectionInfo: null,

    startServer: async (): Promise<void> => {
      if (get().status === 'running') {
        return;
      }

      set({ status: 'running', lastError: null, error: null });

      try {
        const ip = await Network.getIpAddressAsync();
        const port = get().port;
        set({
          hostIp: ip,
          localIp: ip,
          connectionInfo: {
            host: ip,
            port,
            address: `${ip}:${port}`,
          },
        });

        tcpServer = TcpSocket.createServer(onClientConnect);
        tcpServer.on('error', (error: Error) => {
          stopEventLogBroadcasting();
          set({
            status: 'error',
            lastError: error.message,
            error: error.message,
          });
        });
        tcpServer.listen({ port: get().port, host: '0.0.0.0' }, () => {
          set({ status: 'running' });
        });
        startEventLogBroadcasting();
      } catch (error) {
        stopEventLogBroadcasting();
        const message =
          error instanceof Error ? error.message : String(error);
        set({
          status: 'error',
          lastError: message,
          error: message,
        });
      }
    },

    stopServer: (): void => {
      stopEventLogBroadcasting();
      clientSockets.forEach((socket) => socket.destroy());
      clientSockets.clear();
      tcpServer?.close();
      tcpServer = null;
      set({ status: 'idle', connectedClients: [] });
    },

    broadcastState: (): void => {
      broadcastMessage({
        type: 'snapshot',
        messageId: createId('message'),
        snapshot: getBattleSnapshot(),
      });
    },

    restartServer: async (): Promise<void> => {
      stopEventLogBroadcasting();
      clientSockets.forEach((socket) => socket.destroy());
      clientSockets.clear();
      set({ connectedClients: [] });

      await new Promise<void>((resolve) => {
        if (tcpServer) {
          tcpServer.close(() => {
            tcpServer = null;
            resolve();
          });
        } else {
          resolve();
        }
      });

      set({ status: 'idle' });
      await get().startServer();
    },
  };
});
