import { create } from 'zustand';

import type { ClientRole } from '@domain/sync/wsProtocol';
import type { HostAddressCandidate, HostAddressSource } from '../../infrastructure/network/connectionAddress';

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
  renameClient: (deviceId: string, name: string) => void;
  assignClientRole: (deviceId: string, role: ClientRole) => void;
  assignClientAsJudge: (
    deviceId: string,
    battleConfigurationId: string,
  ) => Promise<string | null>;
  unassignClientAsJudge: (
    deviceId: string,
    battleConfigurationId?: string,
  ) => Promise<void>;
};

export const useJudgingServerStore = create<
  JudgingServerState & JudgingServerActions
>((set) => ({
  status: 'idle',
  hostIp: null,
  localIp: null,
  port: 8080,
  connectedClients: [],
  lastError: 'TCP server is disabled in web preview',
  error: null,
  connectionInfo: null,
  hostAddressCandidates: [],
  manualHostOverride: null,

  startServer: async (): Promise<void> => {
    set({
      status: 'idle',
      lastError: 'TCP server is disabled in web preview',
      connectionInfo: null,
    });
  },

  stopServer: (): void => {
    set({ status: 'idle', connectedClients: [], connectionInfo: null });
  },

  restartServer: async (): Promise<void> => {
    set({
      status: 'idle',
      lastError: 'TCP server is disabled in web preview',
      connectionInfo: null,
    });
  },

  refreshHostAddress: async (): Promise<void> => {
    set({
      hostAddressCandidates: [],
      connectionInfo: null,
      lastError: 'Host address discovery is disabled in web preview',
    });
  },

  selectAdvertisedHost: (): void => {
    set({ lastError: 'Host address selection is disabled in web preview' });
  },

  setManualHostOverride: (): void => {
    set({ lastError: 'Manual host override is disabled in web preview' });
  },

  clearManualHostOverride: async (): Promise<void> => {
    set({ manualHostOverride: null });
  },

  broadcastState: (): void => {
    set({ lastError: 'Broadcast is disabled in web preview' });
  },

  renameClient: (): void => undefined,
  assignClientRole: (): void => undefined,
  assignClientAsJudge: async (): Promise<string | null> => null,
  unassignClientAsJudge: async (): Promise<void> => undefined,
}));
