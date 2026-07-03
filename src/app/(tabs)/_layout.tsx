import { Platform, Dimensions, View } from "react-native";
import { Tabs, Redirect } from "expo-router";
import Colors from "@constants/Colors";
import { Icon, TabBar } from "@components";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSessionStore } from "@stores/session/useSessionStore";

const windowHeight = Dimensions.get("window").height;
const IOS = "ios";

export default function TabLayout(): React.JSX.Element {
  const role = useSessionStore((s) => s.role);

  if (!role) {
    return <Redirect href="/(auth)/discovery" />;
  }

  return (
      <Tabs
        screenOptions={({ navigation }) => {
          const state = navigation.getState();
          const hasNestedNavigation =
            Number(state.routes[state.index].state?.index ?? 0) > 0; //  if the current state's route has a state, and its not the index of that route, then we've detected nested navigation

          return {
            headerStyle: { backgroundColor: Colors.dark.background, height: 0 },
            tabBarStyle: {
              ...(Platform.OS === IOS
                ? {
                    backgroundColor: "transparent",
                    borderTopColor: "transparent",
                  }
                : {
                  backgroundColor: Colors.dark.background,
                  borderTopColor: Colors.secondary.dark,
                }),
              height: windowHeight * 0.1,
              paddingTop: 12,
              display: hasNestedNavigation ? "none" : undefined,
            },
            tabBarActiveTintColor: Colors.dark.tint,
          };
        }}
        tabBar={(props) => {
          const state = props.navigation.getState();
          const hasNestedNavigation =
            (state.routes[state.index].state?.index || 0) > 0; //  if the current state's route has a state, and its not the index of that route, then we've detected nested navigation

          return hasNestedNavigation ? <View /> : <TabBar {...props} />;
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "",
            tabBarIcon: ({ color }) => (
              <Icon>
                <Ionicons name="grid-outline" size={24} style={{ color }} />
              </Icon>
            ),
          }}
        />
        <Tabs.Screen
          name="brackets"
          options={{
            title: "",
            tabBarIcon: ({ color }) => (
              <Icon>
                <Ionicons name="trophy-outline" size={24} style={{ color }} />
              </Icon>
            ),
          }}
        />
        <Tabs.Screen
          name="judging"
          options={{
            title: "",
            tabBarIcon: ({ color }) => (
              <Icon>
                <Ionicons name="shield-checkmark-outline" size={24} style={{ color }} />
              </Icon>
            ),
          }}
        />
        <Tabs.Screen
          name="live"
          options={{
            title: "",
            tabBarIcon: ({ color }) => (
              <Icon>
                <Ionicons name="radio-outline" size={24} style={{ color }} />
              </Icon>
            ),
          }}
        />
        <Tabs.Screen
          name="design"
          options={{
            title: "",
            tabBarIcon: ({ color }) => (
              <Icon>
                <Ionicons name="color-palette-outline" size={24} style={{ color }} />
              </Icon>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{ href: null }}
        />
      </Tabs>
  );
}
