import Colors from "@constants/Colors";
import { Redirect } from "expo-router";
import { Box } from "@components";

// TODO: QR validation must be here
const token = "token";

export default function Login(): React.JSX.Element {
  if (token) {
    return <Redirect href="/(auth)/role-selection" />;
  }

  return (
    <Box color={Colors.primary.main} fullHeight fullWidth align="center">
      <Box p={24} mt={48} align="center" gap={24} fullWidth></Box>
    </Box>
  );
}
