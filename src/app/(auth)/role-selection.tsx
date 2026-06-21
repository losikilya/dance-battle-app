import { RoleSelectionScreen } from "@screens/RoleSelectionScreen";
import { useSessionStore } from "@stores/session/useSessionStore";
import { Redirect } from "expo-router";

export default function RoleSelectionRoute(): React.JSX.Element {
  const role = useSessionStore((s) => s.role);

  if (role) {
    return <Redirect href="/(tabs)" />;
  }

  return <RoleSelectionScreen />;
}
