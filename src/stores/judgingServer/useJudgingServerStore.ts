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
import {
  validateAdvertisedHost,
  type HostAddressCandidate,
  type HostAddressSource,
} from '../../infrastructure/network/connectionAddress';
import { resolveAdvertisedHost } from '../../infrastructure/network/hostAddressResolver';
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

export type ServerStatus = 'idle' | 'starting' | 'running' | 'error';

export type HostConnectionInfo = {
  host: string;
  port: number;
  address: string;
  interfaceName: string | null;
  source: HostAddressSource;
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
  hostAddressCandidates: HostAddressCandidate[];
  manualHostOverride: string | null;
};

type JudgingServerActions = {
  startServer: () => Promise<void>;
  stopServer: () => void;
  restartServer: () => Promise<void>;
  refreshHostAddress: () => Promise<void>;
  selectAdvertisedHost: (host: string) => void;
  setManualHostOverride: (host: string) => void;
  clearManualHostOverride: () => Promise<void>;
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
const BIND_HOST = '0.0.0.0';

function createConnectionInfo(
  host: string,
  port: number,
  interfaceName: string | null,
  source: HostAddressSource,
): HostConnectionInfo {
  return {
    host,
    port,
    address: `${host}:${port}`,
    interfaceName,
    source,
  };
}

function getBattleSnapshot() {
  const {
    event,
    participants,
    judges,
    scores,
    battles,
    votes,
    currentQualificationParticipantIndex,
    qualificationTimer,
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
    qualificationTimer,
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

function isJudgeCommand(
  command: AppCommand,
): command is Extract<
  AppCommand,
  { type: 'qualification.submitScore' | 'battle.submitVote' }
> {
  return (
    command.type === 'qualification.submitScore' ||
    command.type === 'battle.submitVote'
  );
}

function isMcTimerCommand(command: AppCommand): boolean {
  return (
    command.type === 'qualification.timer.pause' ||
    command.type === 'qualification.timer.resume' ||
    command.type === 'qualification.timer.restart' ||
    command.type === 'qualification.advanceParticipant'
  );
}

export const useJudgingServerStore = create<
  JudgingServerState & JudgingServerActions
>((set, get) => {
  const applyAdvertisedHost = (
    host: string,
    interfaceName: string | null,
    source: HostAddressSource,
  ): void => {
    const port = get().port;
    const connectionInfo = createConnectionInfo(
      host,
      port,
      interfaceName,
      source,
    );

    set({
      hostIp: host,
      localIp: host,
      connectionInfo,
      lastError: null,
      error: null,
    });
  };

  const refreshHostAddress = async (): Promise<void> => {
    const manualHostOverride = get().manualHostOverride;
    const selection = await resolveAdvertisedHost();

    set({ hostAddressCandidates: selection.candidates });

    if (manualHostOverride) {
      applyAdvertisedHost(manualHostOverride, null, 'manual-override');
      return;
    }

    if (selection.selectedHost) {
      applyAdvertisedHost(
        selection.selectedHost,
        selection.selectedInterfaceName,
        selection.selectedSource ?? 'android-interface',
      );
      console.log('[judging-server] advertised host selected', {
        host: selection.selectedHost,
        interfaceName: selection.selectedInterfaceName,
        source: selection.selectedSource,
        candidates: selection.candidates,
      });
      return;
    }

    set({
      hostIp: null,
      localIp: null,
      connectionInfo: null,
      lastError:
        'No usable LAN IPv4 address is available yet. Refresh after enabling Wi-Fi or Host hotspot.',
      error: null,
    });
    console.log('[judging-server] no advertised host candidate', {
      candidates: selection.candidates,
    });
  };

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
    console.log(
      '[judging-server] join received',
      message.role,
      message.deviceId,
    );
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
    console.log('[judging-server] joined sent', deviceId);

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

    const command = message.command;

    if (client.role === 'mc') {
      if (!isMcTimerCommand(command)) {
        sendError(
          socket,
          'action_not_allowed',
          'MC can control only qualification timer and participant advance',
          message.messageId,
        );
        return;
      }
    } else if (client.role === 'judge') {
      if (client.judgeId === null) {
        sendError(
          socket,
          'action_not_allowed',
          'Judge identity is required before sending commands',
          message.messageId,
        );
        return;
      }

      if (!isJudgeCommand(command) || command.payload.judgeId !== client.judgeId) {
        sendError(
          socket,
          'judge_identity_mismatch',
          'Command does not use the judge assigned to this connection',
          message.messageId,
        );
        return;
      }
    } else {
      sendError(
        socket,
        'action_not_allowed',
        'This client role cannot send commands',
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
    console.log('[judging-server] incoming socket connection');
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
    hostAddressCandidates: [],
    manualHostOverride: null,

    startServer: async (): Promise<void> => {
      if (get().status === 'running' || get().status === 'starting') {
        return;
      }

      set({ status: 'starting', lastError: null, error: null });

      try {
        const port = get().port;
        tcpServer = TcpSocket.createServer(onClientConnect);
        await new Promise<void>((resolve, reject) => {
          const handleError = (error: Error): void => {
            reject(error);
          };

          tcpServer?.on('error', handleError);
          console.log('[judging-server] start', {
            bindAddress: BIND_HOST,
            port,
          });
          tcpServer?.listen({ port, host: BIND_HOST }, () => {
            tcpServer?.removeListener?.('error', handleError);
            resolve();
          });
        });

        tcpServer.on('error', (error: Error) => {
          const message = `TCP server error: ${error.message}`;
          console.log('[judging-server] error', message);
          stopEventLogBroadcasting();
          set({
            status: 'error',
            lastError: message,
            error: message,
          });
        });
        set({
          status: 'running',
          error: null,
        });
        console.log('[judging-server] listening', {
          bindAddress: BIND_HOST,
          port,
        });
        startEventLogBroadcasting();
        await refreshHostAddress();
      } catch (error) {
        stopEventLogBroadcasting();
        tcpServer?.close();
        tcpServer = null;
        const message =
          error instanceof Error
            ? `Failed to start TCP server on ${BIND_HOST}:${get().port}: ${error.message}`
            : `Failed to start TCP server on ${BIND_HOST}:${get().port}: ${String(error)}`;
        console.log('[judging-server] start error', message);
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
      set({
        status: 'idle',
        connectedClients: [],
        connectionInfo: null,
        hostIp: null,
        localIp: null,
      });
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

    refreshHostAddress,

    selectAdvertisedHost: (host): void => {
      const candidate = get().hostAddressCandidates.find(
        item => item.host === host,
      );

      if (!candidate) {
        set({
          lastError: 'Selected address is not available from current candidates',
          error: null,
        });
        return;
      }

      set({ manualHostOverride: null });
      applyAdvertisedHost(
        candidate.host,
        candidate.interfaceName,
        candidate.source,
      );
    },

    setManualHostOverride: (host): void => {
      const result = validateAdvertisedHost(host);

      if (!result.ok) {
        set({ lastError: result.error, error: null });
        return;
      }

      const overrideHost = result.value.host;
      set({ manualHostOverride: overrideHost });
      applyAdvertisedHost(overrideHost, null, 'manual-override');
    },

    clearManualHostOverride: async (): Promise<void> => {
      set({ manualHostOverride: null });
      await refreshHostAddress();
    },
  };
});
