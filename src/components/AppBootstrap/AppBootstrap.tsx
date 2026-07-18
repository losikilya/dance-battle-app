import { useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import { Box } from '../Box';
import { Text } from '../Text';
import Colors from '@constants/Colors';
import { getResource } from '@resources';
import { useDemoBattleStore } from '@stores/demoBattle/useDemoBattleStore';
import { useSessionStore } from '@stores/session/useSessionStore';
import { useJudgingServerStore } from '@stores/judgingServer/useJudgingServerStore';
import { useJudgingClientStore } from '@stores/judgingClient/useJudgingClientStore';

export function AppBootstrap({ children }: { children: React.ReactNode }) {
  const hydrateFromStorage = useDemoBattleStore(s => s.hydrateFromStorage);
  const isHydrated = useDemoBattleStore(s => s.isHydrated);
  const isHydrating = useDemoBattleStore(s => s.isHydrating);
  const storageError = useDemoBattleStore(s => s.storageError);
  const roles = useSessionStore(s => s.roles);
  const hasHostRole = useSessionStore(s => s.hasRole('host'));
  const startServer = useJudgingServerStore(s => s.startServer);
  const stopServer = useJudgingServerStore(s => s.stopServer);
  const disconnectClient = useJudgingClientStore(s => s.disconnect);

  useEffect(() => {
    void hydrateFromStorage();
  }, [hydrateFromStorage]);

  useEffect(() => {
    if (isHydrated && hasHostRole) {
      void startServer();
    }
  }, [hasHostRole, isHydrated, startServer]);

  useEffect(() => {
    if (!hasHostRole) {
      stopServer();
    }
  }, [hasHostRole, stopServer]);

  useEffect(() => {
    if (roles.length === 0) {
      disconnectClient();
    }
  }, [disconnectClient, roles.length]);

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
