import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-gesture-handler";
import { AppBootstrap } from "../components/AppBootstrap";
import Colors from "@constants/Colors";

export {
  ErrorBoundary,
} from "expo-router";

// eslint-disable-next-line @typescript-eslint/naming-convention
export const unstable_settings = {
  initialRouteName: "(tabs)",
};

const RootWithQuery: React.FC = () => {
  return (
    <AppBootstrap>
      <GestureHandlerRootView
        style={{ flex: 1, backgroundColor: Colors.dark.background }}
      >
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: Colors.dark.background },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)/discovery" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)/role-selection" options={{ headerShown: false }} />
          <Stack.Screen name="participants" options={{ headerShown: false }} />
          <Stack.Screen name="battle-dashboard" options={{ headerShown: false }} />
          <Stack.Screen name="create-event" options={{ headerShown: false }} />
          <Stack.Screen name="configure-battle" options={{ headerShown: false }} />
          <Stack.Screen name="scan-qr" options={{ headerShown: false }} />
        </Stack>
      </GestureHandlerRootView>
    </AppBootstrap>
  );
};

export default RootWithQuery;
