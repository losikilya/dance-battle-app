import { useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import { Box } from '../Box';
import { Text } from '../Text';
import Colors from '@constants/Colors';
import { getResource } from '@resources';
import { useDemoBattleStore } from '@stores/demoBattle/useDemoBattleStore';
import { useSessionStore } from '@stores/session/useSessionStore';
import { useJudgingServerStore } from '@stores/judgingServer/useJudgingServerStore';

export function AppBootstrap({ children }: { children: React.ReactNode }) {
  const hydrateFromStorage = useDemoBattleStore(s => s.hydrateFromStorage);
  const isHydrated = useDemoBattleStore(s => s.isHydrated);
  const isHydrating = useDemoBattleStore(s => s.isHydrating);
  const storageError = useDemoBattleStore(s => s.storageError);
  const role = useSessionStore(s => s.role);
  const startServer = useJudgingServerStore(s => s.startServer);

  useEffect(() => {
    void hydrateFromStorage();
  }, [hydrateFromStorage]);

  useEffect(() => {
    if (isHydrated && role === 'host') {
      void startServer();
    }
  }, [isHydrated, role, startServer]);

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
