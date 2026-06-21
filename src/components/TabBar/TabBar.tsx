import React from "react";
import { BottomTabBar } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets, SafeAreaInsetsContext } from "react-native-safe-area-context";

export const TabBar: React.FC<BottomTabBarProps> = (props) => {
  const insets = useSafeAreaInsets();

  return (
    <BlurView
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: insets.bottom,
      }}
      tint="dark"
      intensity={60}
    >
      <SafeAreaInsetsContext.Provider value={{ top: insets.top, right: insets.right, bottom: 0, left: insets.left }}>
        <BottomTabBar style={{ borderWidth: 0 }} {...props} />
      </SafeAreaInsetsContext.Provider>
    </BlurView>
  );
};
