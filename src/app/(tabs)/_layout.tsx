import { Platform, Dimensions, View } from "react-native";
import { Tabs, Redirect } from "expo-router";
import Colors from "@constants/Colors";
import { Icon, TabBar } from "@components";
import Ionicons from "@expo/vector-icons/Ionicons";

const windowHeight = Dimensions.get("window").height;
const IOS = "ios";

// TODO: QR validation must be here
const token = "token";

export default function TabLayout(): React.JSX.Element {
  // Only require authentication within the (app) group's layout as users
  // need to be able to access the (auth) group and sign in again.
  if (!token) {
    // On web, static rendering will stop here as the user is not authenticated
    // in the headless Node process that the pages are rendered in.
    return <Redirect href="/(auth)/login" />;
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
                  }
                : {}),
              height: windowHeight * 0.1,
              borderTopColor: "transparent",
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
          name="profile"
          options={{
            title: "",
            tabBarIcon: ({ color }) => (
              <Ionicons
                name="git-network-outline"
                size={24}
                style={{ color }}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="event"
          options={{
            title: "",
            tabBarIcon: ({ color }) => (
              <Ionicons name="create-outline" size={24} style={{ color }} />
            ),
          }}
        />
        <Tabs.Screen
          name="design"
          options={{
            title: "",
            tabBarIcon: ({ color }) => (
              <Ionicons
                name="color-palette-outline"
                size={24}
                style={{ color }}
              />
            ),
          }}
        />
      </Tabs>
  );
}
