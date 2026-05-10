import React from "react";
import { BottomTabBar } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";

export const TabBar: React.FC<BottomTabBarProps> = (props) => {
  return (
    <BlurView
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
      }}
      tint="dark"
      intensity={60}
    >
      <BottomTabBar style={{ borderWidth: 0 }} {...props} />
    </BlurView>
  );
};
