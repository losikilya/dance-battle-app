import { Redirect } from 'expo-router';

import { HostBattlesScreen } from '@screens/HostBattlesScreen';
import { useJudgingClientStore } from '@stores/judgingClient/useJudgingClientStore';
import { useSessionStore } from '@stores/session/useSessionStore';

export default function HostBattlesRoute(): React.JSX.Element {
  const isHost = useSessionStore((state) => state.roles.includes('host'));
  const assignedClientRole = useJudgingClientStore((state) => state.role);

  if (!isHost || assignedClientRole !== null) {
    return <Redirect href="/(auth)/discovery" />;
  }

  return <HostBattlesScreen />;
}
