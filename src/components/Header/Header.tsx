import Colors from "@constants/Colors";
import { router } from "expo-router";
import React from "react";
import Ionicons from "@expo/vector-icons/Ionicons";

import { Box } from "../Box";
import { IconButton } from "../IconButton";

export const Header: React.FC = () => {
  return (
    <Box
      fullWidth
      align="center"
      pr={24}
      direction="row"
      justify="space-between"
    >
      <IconButton onPress={() => router.canGoBack() && router.back()}>
        <Ionicons name="arrow-back" size={24} style={{ color: Colors.text.primary }} />
      </IconButton>
    </Box>
  );
};
