import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { useDemoBattleStore } from '../stores/demoBattle/useDemoBattleStore';

export function AppBootstrap({ children }: { children: React.ReactNode }) {
  const hydrateFromStorage = useDemoBattleStore(
    (state) => state.hydrateFromStorage,
  );

  const isHydrated = useDemoBattleStore((state) => state.isHydrated);
  const isHydrating = useDemoBattleStore((state) => state.isHydrating);
  const storageError = useDemoBattleStore((state) => state.storageError);

  useEffect(() => {
    void hydrateFromStorage();
  }, [hydrateFromStorage]);

  if (!isHydrated || isHydrating) {
    return (
      <View>
        <ActivityIndicator />
        <Text>Loading battle...</Text>
      </View>
    );
  }

  if (storageError) {
    return (
      <View>
        <Text>Storage error</Text>
        <Text>{storageError}</Text>
      </View>
    );
  }

  return <>{children}</>;
}