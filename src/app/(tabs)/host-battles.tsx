import { Redirect } from 'expo-router';

import { HostBattlesScreen } from '@screens/HostBattlesScreen';
import { useSessionStore } from '@stores/session/useSessionStore';

export default function HostBattlesRoute(): React.JSX.Element {
  const role = useSessionStore((state) => state.role);

  if (role !== 'host') {
    return <Redirect href="/(auth)/role-selection" />;
  }

  return <HostBattlesScreen />;
}
