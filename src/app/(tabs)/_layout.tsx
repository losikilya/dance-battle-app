import { Dimensions, Platform, View } from "react-native";
import { Redirect, Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

import { AppTopMenu, Icon, TabBar } from "@components";
import Colors from "@constants/Colors";
import { getResource } from "@resources";
import { useJudgingClientStore } from "@stores/judgingClient/useJudgingClientStore";
import { useSessionStore } from "@stores/session/useSessionStore";

const windowHeight = Dimensions.get("window").height;
const IOS = "ios";

export default function TabLayout(): React.JSX.Element {
  const roles = useSessionStore((s) => s.roles);
  const assignedClientRole = useJudgingClientStore((s) => s.role);
  const effectiveRole = assignedClientRole ?? (roles.includes("host")
    ? "host"
    : roles.find((item) => item !== "spectator") ?? "spectator");
  const isHost = effectiveRole === "host";

  if (roles.length === 0) {
    return <Redirect href="/(auth)/discovery" />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.dark.background }}>
      <Tabs
        screenOptions={({ navigation }) => {
          const state = navigation.getState();
          const hasNestedNavigation =
            Number(state.routes[state.index].state?.index ?? 0) > 0;
          const shouldShowTabBar = isHost && !hasNestedNavigation;

          return {
            headerShown: false,
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
              display: shouldShowTabBar ? undefined : "none",
            },
            tabBarActiveTintColor: Colors.dark.tint,
          };
        }}
        tabBar={(props) => {
          const state = props.navigation.getState();
          const hasNestedNavigation =
            Number(state.routes[state.index].state?.index ?? 0) > 0;
          const shouldShowTabBar = isHost && !hasNestedNavigation;

          return shouldShowTabBar ? <TabBar {...props} /> : <View />;
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: isHost ? getResource("host_tabs_dashboard") : "",
            tabBarIcon: ({ color }) => (
              <Icon>
                <Ionicons name="grid-outline" size={24} style={{ color }} />
              </Icon>
            ),
          }}
        />
        <Tabs.Screen
          name="host-battles"
          options={{
            href: isHost ? undefined : null,
            title: isHost ? getResource("host_tabs_battles") : "",
            tabBarIcon: ({ color }) => (
              <Icon>
                <Ionicons name="flash-outline" size={24} style={{ color }} />
              </Icon>
            ),
          }}
        />
        <Tabs.Screen
          name="brackets"
          options={{
            href: isHost ? null : undefined,
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
            href: isHost ? null : undefined,
            title: "",
            tabBarIcon: ({ color }) => (
              <Icon>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={24}
                  style={{ color }}
                />
              </Icon>
            ),
          }}
        />
        <Tabs.Screen
          name="live"
          options={{
            href: isHost ? null : undefined,
            title: "",
            tabBarIcon: ({ color }) => (
              <Icon>
                <Ionicons name="radio-outline" size={24} style={{ color }} />
              </Icon>
            ),
          }}
        />
        <Tabs.Screen name="profile" options={{ href: null }} />
        <Tabs.Screen name="design" options={{ href: null }} />
      </Tabs>
      <AppTopMenu />
    </View>
  );
}
