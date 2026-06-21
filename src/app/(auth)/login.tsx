import Colors from "@constants/Colors";
import { Redirect } from "expo-router";
import { Box } from "@components";
import { useSessionStore } from "@stores/session/useSessionStore";

export default function Login(): React.JSX.Element {
  const role = useSessionStore((s) => s.role);

  if (role) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Box color={Colors.primary.main} fullHeight fullWidth align="center">
      <Box p={24} mt={48} align="center" gap={24} fullWidth></Box>
    </Box>
  );
}
