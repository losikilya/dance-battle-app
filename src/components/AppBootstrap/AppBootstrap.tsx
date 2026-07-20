import { useEffect } from 'react';
import { ActivityIndicator, Platform } from 'react-native';
import { Box } from '../Box';
import { Text } from '../Text';
import Colors from '@constants/Colors';
import { getResource } from '@resources';
import { useDemoBattleStore } from '@stores/demoBattle/useDemoBattleStore';
import { useSessionStore } from '@stores/session/useSessionStore';
import { useJudgingServerStore } from '@stores/judgingServer/useJudgingServerStore';
import { useJudgingClientStore } from '@stores/judgingClient/useJudgingClientStore';

export function AppBootstrap({ children }: { children: React.ReactNode }) {
  const isWebPreview = Platform.OS === 'web';
  const hydrateFromStorage = useDemoBattleStore(s => s.hydrateFromStorage);
  const isHydrated = useDemoBattleStore(s => s.isHydrated);
  const isHydrating = useDemoBattleStore(s => s.isHydrating);
  const storageError = useDemoBattleStore(s => s.storageError);
  const roles = useSessionStore(s => s.roles);
  const hasHostRole = roles.includes('host');
  const hasRoles = roles.length > 0;
  const startServer = useJudgingServerStore(s => s.startServer);
  const stopServer = useJudgingServerStore(s => s.stopServer);
  const serverStatus = useJudgingServerStore(s => s.status);
  const assignedClientRole = useJudgingClientStore(s => s.role);
  const isLocalHostMode = hasHostRole && assignedClientRole === null;
  const resetConnectionTarget = useJudgingClientStore(
    s => s.resetConnectionTarget,
  );
  const hydrateDeviceId = useJudgingClientStore(s => s.hydrateDeviceId);
  const hasStaleClientState = useJudgingClientStore(s =>
    s.status !== 'disconnected' ||
    s.host !== null ||
    s.port !== null ||
    s.serverAddress !== null ||
    s.role !== null ||
    s.name !== null ||
    s.requestedJudgeId !== null ||
    s.assignedJudgeId !== null ||
    s.assignedJudgeName !== null ||
    s.syncedState !== null ||
    s.pendingAddress !== null,
  );

  useEffect(() => {
    void hydrateFromStorage();
    if (!isWebPreview) {
      void hydrateDeviceId();
    }
  }, [hydrateFromStorage, hydrateDeviceId, isWebPreview]);

  useEffect(() => {
    if (isWebPreview) {
      return;
    }

    if (isHydrated && isLocalHostMode) {
      void startServer();
    }
  }, [isHydrated, isLocalHostMode, isWebPreview, startServer]);

  useEffect(() => {
    if (isWebPreview) {
      return;
    }

    if (isHydrated && !isLocalHostMode && serverStatus !== 'idle') {
      stopServer();
    }
  }, [isHydrated, isLocalHostMode, isWebPreview, serverStatus, stopServer]);

  useEffect(() => {
    if (isWebPreview) {
      return;
    }

    if (isHydrated && !hasRoles && hasStaleClientState) {
      resetConnectionTarget();
    }
  }, [
    isHydrated,
    hasRoles,
    hasStaleClientState,
    isWebPreview,
    resetConnectionTarget,
  ]);

  if (!isHydrated || isHydrating) {
    return (
      <Box fullHeight align="center" justify="center" color={Colors.dark.background} gap={16}>
        <ActivityIndicator color={Colors.primary.main} />
        <Text variant="body2" color="textSecondary">{getResource('app_loading')}</Text>
      </Box>
    );
  }

  if (storageError) {
    return (
      <Box fullHeight align="center" justify="center" color={Colors.dark.background} gap={8} px={24}>
        <Text variant="bodyBold">{getResource('app_storage_error')}</Text>
        <Text variant="body2" color="textSecondary">{storageError}</Text>
      </Box>
    );
  }

  return <>{children}</>;
}
