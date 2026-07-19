import { Redirect } from 'expo-router';

import { HostBattlesScreen } from '@screens/HostBattlesScreen';
import { useSessionStore } from '@stores/session/useSessionStore';

export default function HostBattlesRoute(): React.JSX.Element {
  const isHost = useSessionStore((state) => state.roles.includes('host'));

  if (!isHost) {
    return <Redirect href="/(auth)/discovery" />;
  }

  return <HostBattlesScreen />;
}
