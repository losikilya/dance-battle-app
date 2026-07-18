import { CreateEventScreen } from '@screens/CreateEventScreen';
import { useSessionStore } from '@stores/session/useSessionStore';
import { Redirect } from 'expo-router';

export default function CreateEventRoute(): React.JSX.Element {
  const roles = useSessionStore(s => s.roles);
  const hasHostRole = useSessionStore(s => s.hasRole('host'));

  if (roles.length === 0) {
    return <Redirect href="/(auth)/discovery" />;
  }

  if (!hasHostRole) {
    return <Redirect href="/(tabs)" />;
  }

  return <CreateEventScreen />;
}
