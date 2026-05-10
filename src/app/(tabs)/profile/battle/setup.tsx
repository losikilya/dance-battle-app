import Colors from "@constants/Colors";
import { router } from "expo-router";
import { Box, IconButton, Text, List } from "@components";
import { HEADER_HEIGHT, SCREEN_HEIGHT } from "@constants/Dimensions";
import { getResource } from "@resources";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function SetupScreen(): React.JSX.Element {
  return (
    <Box pt={HEADER_HEIGHT} color={Colors.dark.background} style={{ flex: 1 }}>
      <List>
        <Box style={{ height: SCREEN_HEIGHT }} pt={24}>
          <Box p={24} direction="row" align="center">
            <IconButton
              style={{ position: "absolute", left: 24, zIndex: 1 }}
              variant="contained"
              onPress={() => router.canGoBack() && router.back()}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                style={{ color: Colors.text.primary }}
              />
            </IconButton>
            <Box fullWidth align="center" justify="center">
              <Text variant="bodyBold" color="textSecondary">
                {getResource("initial_setup")}
              </Text>
            </Box>
          </Box>
        </Box>
      </List>
    </Box>
  );
}
