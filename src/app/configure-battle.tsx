import { Redirect } from 'expo-router';
import { ConfigureBattleScreen } from '@screens/ConfigureBattleScreen';
import { useJudgingClientStore } from '@stores/judgingClient/useJudgingClientStore';
import { useSessionStore } from '@stores/session/useSessionStore';

export default function ConfigureBattleRoute(): React.JSX.Element {
  const roles = useSessionStore(state => state.roles);
  const assignedClientRole = useJudgingClientStore(state => state.role);

  if (roles.length === 0) {
    return <Redirect href="/(auth)/discovery" />;
  }

  if (!roles.includes('host') || assignedClientRole !== null) {
    return <Redirect href="/(tabs)" />;
  }

  return <ConfigureBattleScreen />;
}
