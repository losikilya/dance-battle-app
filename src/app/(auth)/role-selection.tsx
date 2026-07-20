import { useSessionStore } from "@stores/session/useSessionStore";
import { Redirect } from "expo-router";

export default function RoleSelectionRoute(): React.JSX.Element {
  const hasRoles = useSessionStore((s) => s.roles.length > 0);

  return <Redirect href={hasRoles ? "/(tabs)" : "/(auth)/discovery"} />;
}
