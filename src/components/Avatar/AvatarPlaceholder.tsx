import Colors from "@constants/Colors";
import React from "react";
import { StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { Box } from "../Box";
import { Icon } from "../Icon";

type Size = "xlarge" | "large" | "medium" | "small";

type AvatarPlaceholderProps = {
  size?: number | string | Size;
};

const sizeMap: Record<Size, number> = {
  xlarge: 98,
  large: 64,
  medium: 48,
  small: 40,
};

const styles = StyleSheet.create({
  placeholder: {
    height: 40,
    width: 40,
    backgroundColor: Colors.dark.background,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 100,
  },
});

export const AvatarPlaceholder: React.FC<AvatarPlaceholderProps> = ({
  size: rawSize = "small",
}) => {
  const size = sizeMap[rawSize as Size] ?? rawSize;

  return (
    <Box style={{ ...styles.placeholder, height: size, width: size }}>
      <Ionicons
        name="person-outline"
        size={size / 2}
        color={Colors.text.disabled}
      />
    </Box>
  );
};
