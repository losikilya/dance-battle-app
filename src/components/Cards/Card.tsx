import { SCREEN_HEIGHT, SCREEN_WIDTH } from "@constants/Dimensions";
import { BlurView } from "expo-blur";
import React, { PropsWithChildren } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

const styles = StyleSheet.create({
  root: {
    padding: 24,
    borderRadius: 32,
    position: "relative",
    display: "flex",
    flexDirection: "column",
    width: "100%",
    overflow: "hidden",
    borderWidth: 1,
    backgroundColor: "#0e1417",
    borderColor: "rgba(255,255,255,0.08)",
  },
  screenWidth: { width: SCREEN_WIDTH },
  blurred: {
    backgroundColor: "rgba(255, 255, 255, 0.50)",
    opacity: 1,
  },
  rounded: {
    borderRadius: 48,
  },
  small: {
    height: 104,
  },
  medium: {
    height: 209,
  },
  large: {
    height: SCREEN_HEIGHT * 0.75,
  },
  dark: { backgroundColor: "rgba(11, 12, 14, 0.75)" },
});

type Sizes = "large" | "medium" | "small";

type CardProps = {
  blurred?: boolean;
  roundBorder?: boolean;
  screenWidth?: boolean;
  size?: Sizes | number;
  style?: StyleProp<ViewStyle>;
  dark?: boolean;
};

export const Card: React.FC<PropsWithChildren<CardProps>> = ({
  children,
  blurred = false,
  roundBorder = false,
  screenWidth = false,
  dark = false,
  size,
  style,
}) => {
  const sizeStyles = size
    ? styles[size as Sizes] || { height: size }
    : undefined;

  const commonStyles = [
    styles.root,
    sizeStyles,
    roundBorder && styles.rounded,
    screenWidth && styles.screenWidth,
  ];

  return blurred ? (
    <BlurView
      style={[
        ...commonStyles,
        blurred && styles.blurred,
        dark && styles.dark,
        style,
      ]}
      intensity={16}
      tint={dark ? "dark" : "light"}
    >
      {children}
    </BlurView>
  ) : (
    <View style={[...commonStyles, style]}>{children}</View>
  );
};
