import { HostDashboardScreen } from "@screens/HostDashboardScreen";
import { useJudgingClientStore } from "@stores/judgingClient/useJudgingClientStore";
import { useSessionStore } from "@stores/session/useSessionStore";
import { Redirect } from "expo-router";

export default function DashboardTab(): React.JSX.Element {
  const roles = useSessionStore((s) => s.roles);
  const assignedClientRole = useJudgingClientStore((s) => s.role);
  const effectiveRole = roles.includes("host")
    ? "host"
    : assignedClientRole ?? roles.find((item) => item !== "spectator") ?? "spectator";

  if (effectiveRole === "host") {
    return <HostDashboardScreen />;
  }

  if (effectiveRole === "judge") {
    return <Redirect href="/(tabs)/judging" />;
  }

  return <Redirect href="/(tabs)/live" />;
}
