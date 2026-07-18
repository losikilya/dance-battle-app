import { HostDashboardScreen } from "@screens/HostDashboardScreen";
import { Box, Text, Button } from "@components";
import Colors from "@constants/Colors";
import { getResource } from "@resources";
import { useSessionStore } from "@stores/session/useSessionStore";
import { useJudgingClientStore } from "@stores/judgingClient/useJudgingClientStore";
import { useJudgingServerStore } from "@stores/judgingServer/useJudgingServerStore";
import { useRouter } from "expo-router";

export default function DashboardTab(): React.JSX.Element {
  const activeViewRole = useSessionStore((s) => s.activeViewRole);
  const hasHostRole = useSessionStore((s) => s.hasRole("host"));
  const resetSession = useSessionStore((s) => s.resetSession);
  const router = useRouter();

  const handleResetRole = () => {
    useJudgingServerStore.getState().stopServer();
    useJudgingClientStore.getState().disconnect();
    useJudgingClientStore.getState().setPendingAddress(null);
    resetSession();
    router.replace("/(auth)/role-selection");
  };

  if (hasHostRole) {
    return <HostDashboardScreen onResetRole={handleResetRole} />;
  }

  const hint =
    activeViewRole === "judge"
      ? getResource("dashboard_judge_hint")
      : activeViewRole === "mc"
        ? getResource("dashboard_mc_placeholder")
        : getResource("dashboard_spectator_placeholder");

  return (
    <Box
      fullHeight
      color={Colors.dark.background}
      align="center"
      justify="center"
      px={24}
      gap={8}
    >
      <Text variant="bodyBold" centered>
        {getResource("role_selection_app_name")}
      </Text>
      <Text variant="body2" color="textSecondary" centered>
        {hint}
      </Text>
      <Button variant="outlined" color="secondary" onPress={handleResetRole}>
        {getResource("dashboard_reset_role")}
      </Button>
    </Box>
  );
}
