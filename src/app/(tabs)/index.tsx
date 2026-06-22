import { HostDashboardScreen } from "@screens/HostDashboardScreen";
import { Box, Text, Button } from "@components";
import Colors from "@constants/Colors";
import { getResource } from "@resources";
import { useSessionStore } from "@stores/session/useSessionStore";
import { useRouter } from "expo-router";

export default function DashboardTab(): React.JSX.Element {
  const role = useSessionStore((s) => s.role);
  const setRole = useSessionStore((s) => s.setRole);
  const router = useRouter();

  const handleResetRole = () => {
    setRole(null);
    router.replace("/(auth)/role-selection");
  };

  console.log("🚀 ~ DashboardTab ~ role:", role)
  if (role === "host") {
    return <HostDashboardScreen onResetRole={handleResetRole} />;
  }

  const hint =
    role === "judge"
      ? getResource("dashboard_judge_hint")
      : role === "mc"
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
