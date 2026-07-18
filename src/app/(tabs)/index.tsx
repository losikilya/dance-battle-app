import { HostDashboardScreen } from "@screens/HostDashboardScreen";
import { useSessionStore } from "@stores/session/useSessionStore";
import { Redirect } from "expo-router";

export default function DashboardTab(): React.JSX.Element {
  const role = useSessionStore((s) => s.role);

  if (role === "host") {
    return <HostDashboardScreen />;
  }

  if (role === "judge") {
    return <Redirect href="/(tabs)/judging" />;
  }

  return <Redirect href="/(tabs)/live" />;
}
