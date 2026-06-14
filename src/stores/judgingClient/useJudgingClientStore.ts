import { create } from 'zustand';
import TcpSocket from 'react-native-tcp-socket';
import type { Socket as TcpSocketSocket } from 'react-native-tcp-socket';
import { BattleAppState } from '@domain/sync/appState';
import { HostMessage } from '@domain/sync/wsProtocol';

// The .d.ts namespace omits createConnection from the inferred type; cast via unknown to access it
type TcpModule = typeof TcpSocket & {
  createConnection: (options: { host: string; port: number }, callback: () => void) => TcpSocketSocket;
};
const createTcpConnection = (
  options: { host: string; port: number },
  callback: () => void,
): TcpSocketSocket => (TcpSocket as TcpModule).createConnection(options, callback);

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

type JudgingClientState = {
  status: ConnectionStatus;
  serverAddress: string | null;
  deviceId: string | null;
  syncedState: BattleAppState | null;
  error: string | null;
};

type JudgingClientActions = {
  connect: (address: string) => void;
  disconnect: () => void;
  sendScore: (params: { participantId: string; judgeId: string; score: number }) => void;
  sendVote: (params: { battleId: string; winnerId: string }) => void;
};

let clientSocket: TcpSocketSocket | null = null;
let reconnectAttempts = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

export const useJudgingClientStore = create<JudgingClientState & JudgingClientActions>(
  (set, get) => {
    const handleMessage = (msg: HostMessage): void => {
      if (msg.type === 'ack') {
        set({ deviceId: msg.deviceId });
        return;
      }
      if (msg.type === 'state_sync') {
        set({ syncedState: msg.state });
        return;
      }
    };

    const tryReconnect = (): void => {
      if (reconnectAttempts >= 5) {
        set({ status: 'error' });
        return;
      }
      reconnectAttempts++;
      set({ status: 'reconnecting' });
      reconnectTimer = setTimeout(() => {
        const address = get().serverAddress;
        if (address !== null) {
          get().connect(address);
        }
      }, 3000);
    };

    return {
      status: 'disconnected',
      serverAddress: null,
      deviceId: null,
      syncedState: null,
      error: null,

      connect: (address: string): void => {
        const lastColon = address.lastIndexOf(':');
        const host = address.slice(0, lastColon);
        const port = address.slice(lastColon + 1);

        if (clientSocket !== null) {
          clientSocket.destroy();
          clientSocket = null;
        }

        set({ status: 'connecting', serverAddress: address });

        let buffer = '';

        clientSocket = createTcpConnection(
          { host, port: Number(port) },
          () => {
            set({ status: 'connected', error: null });
            reconnectAttempts = 0;
          },
        );

        clientSocket.on('data', (data: Buffer | string) => {
          buffer += data.toString();
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          lines.filter(Boolean).forEach((line) => {
            try {
              handleMessage(JSON.parse(line) as HostMessage);
            } catch {
            }
          });
        });

        clientSocket.on('close', () => {
          if (get().status === 'connected') {
            tryReconnect();
          }
        });

        clientSocket.on('error', (err: Error) => {
          set({ error: err.message });
          tryReconnect();
        });
      },

      disconnect: (): void => {
        if (reconnectTimer !== null) {
          clearTimeout(reconnectTimer);
          reconnectTimer = null;
        }
        if (clientSocket !== null) {
          clientSocket.destroy();
          clientSocket = null;
        }
        reconnectAttempts = 0;
        set({
          status: 'disconnected',
          syncedState: null,
          deviceId: null,
          error: null,
        });
      },

      sendScore: (params: { participantId: string; judgeId: string; score: number }): void => {
        if (clientSocket !== null && get().status === 'connected') {
          clientSocket.write(JSON.stringify({ type: 'score', ...params }) + '\n');
        }
      },

      sendVote: (params: { battleId: string; winnerId: string }): void => {
        if (clientSocket !== null && get().status === 'connected') {
          clientSocket.write(JSON.stringify({ type: 'vote', ...params }) + '\n');
        }
      },
    };
  },
);
