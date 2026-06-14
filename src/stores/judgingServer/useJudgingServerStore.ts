import { create } from 'zustand';
import TcpSocket, { Socket as TcpSocketSocket } from 'react-native-tcp-socket';
import * as Network from 'expo-network';
import { createId } from '../../shared/lib/createId';
import { ClientMessage, ClientRole, HostMessage } from '@domain/sync/wsProtocol';
import { useDemoBattleStore } from '../demoBattle/useDemoBattleStore';

export type ConnectedClient = {
  deviceId: string;
  judgeId: string | null;
  name: string;
  role: ClientRole;
  isOnline: boolean;
};

type ServerStatus = 'idle' | 'running' | 'error';

type JudgingServerState = {
  status: ServerStatus;
  localIp: string | null;
  port: number;
  connectedClients: ConnectedClient[];
  error: string | null;
};

type JudgingServerActions = {
  startServer: () => Promise<void>;
  stopServer: () => void;
  restartServer: () => Promise<void>;
};

// Module-level refs — not serializable, intentionally outside Zustand state
let tcpServer: ReturnType<typeof TcpSocket.createServer> | null = null;
const clientSockets = new Map<string, TcpSocketSocket>();

export const useJudgingServerStore = create<JudgingServerState & JudgingServerActions>(
  (set, get) => {
    const sendToClient = (deviceId: string, message: HostMessage): void => {
      const socket = clientSockets.get(deviceId);
      if (socket && !socket.destroyed) {
        socket.write(JSON.stringify(message) + '\n');
      }
    };

    const handleClientMessage = (deviceId: string, message: ClientMessage): void => {
      if (message.type === 'identify') {
        set((state) => ({
          connectedClients: state.connectedClients.map((c) =>
            c.deviceId === deviceId
              ? { ...c, judgeId: message.judgeId, name: message.name, role: message.role }
              : c,
          ),
        }));

        const {
          event, participants, judges, scores, battles, votes,
          currentQualificationParticipantIndex, activeBattleId,
        } = useDemoBattleStore.getState();

        sendToClient(deviceId, {
          type: 'state_sync',
          state: {
            event, participants, judges, scores, battles, votes,
            currentQualificationParticipantIndex, activeBattleId,
          },
        });
        return;
      }

      if (message.type === 'vote') {
        const client = get().connectedClients.find((c) => c.deviceId === deviceId);
        if (client?.judgeId) {
          useDemoBattleStore.getState().submitBattleVote({
            battleId: message.battleId,
            judgeId: client.judgeId,
            winnerId: message.winnerId,
          });
        }
        return;
      }

      if (message.type === 'score') {
        useDemoBattleStore.getState().submitQualificationScore({
          participantId: message.participantId,
          judgeId: message.judgeId,
          score: message.score,
        });
      }
    };

    const onClientConnect = (socket: TcpSocketSocket): void => {
      const deviceId = createId('device');
      let buffer = '';

      clientSockets.set(deviceId, socket);
      set((state) => ({
        connectedClients: [
          ...state.connectedClients,
          { deviceId, judgeId: null, name: 'Unknown', role: 'spectator', isOnline: true },
        ],
      }));

      sendToClient(deviceId, { type: 'ack', deviceId });

      socket.on('data', (data: Buffer | string) => {
        buffer += data.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        lines.filter(Boolean).forEach((line) => {
          try {
            handleClientMessage(deviceId, JSON.parse(line) as ClientMessage);
          } catch {
            // Ignore malformed messages
          }
        });
      });

      const markOffline = (): void => {
        clientSockets.delete(deviceId);
        set((state) => ({
          connectedClients: state.connectedClients.map((c) =>
            c.deviceId === deviceId ? { ...c, isOnline: false } : c,
          ),
        }));
      };

      socket.on('close', markOffline);
      socket.on('error', markOffline);
    };

    return {
      status: 'idle',
      localIp: null,
      port: 8080,
      connectedClients: [],
      error: null,

      startServer: async (): Promise<void> => {
        if (get().status === 'running') return;
        set({ status: 'running', error: null });
        try {
          const ip = await Network.getIpAddressAsync();
          set({ localIp: ip });

          tcpServer = TcpSocket.createServer(onClientConnect);

          tcpServer.on('error', (err: Error) => {
            set({ status: 'error', error: err.message });
          });

          tcpServer.listen({ port: get().port, host: '0.0.0.0' }, () => {
            set({ status: 'running' });
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          set({ status: 'error', error: message });
        }
      },

      stopServer: (): void => {
        clientSockets.forEach((socket) => socket.destroy());
        clientSockets.clear();
        tcpServer?.close();
        tcpServer = null;
        set({ status: 'idle', connectedClients: [] });
      },

      restartServer: async (): Promise<void> => {
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
  },
);
