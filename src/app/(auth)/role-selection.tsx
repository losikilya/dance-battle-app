import { RoleSelectionScreen } from "@screens/RoleSelectionScreen";
import { useSessionStore } from "@stores/session/useSessionStore";
import { Redirect } from "expo-router";

export default function RoleSelectionRoute(): React.JSX.Element {
  const roles = useSessionStore((s) => s.roles);

  if (roles.length > 0) {
    return <Redirect href="/(tabs)" />;
  }

  return <RoleSelectionScreen />;
}
