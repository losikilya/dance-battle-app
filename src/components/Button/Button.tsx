import React, { PropsWithChildren } from "react";
import {
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from "react-native";
import Colors from "@constants/Colors";

import { Text } from "../Text";
import { Box } from "../Box";

type ButtonProps = PropsWithChildren & {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  startIcon?: JSX.Element;
  endIcon?: JSX.Element;
  color?: "primary" | "secondary" | "secondaryDark" | "error";
  variant?: "outlined" | "contained" | "text";
  cornerIcon?: boolean;
  disabled?: boolean;
};

const styles = StyleSheet.create({
  button: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderRadius: 32,
    alignSelf: "stretch",
  },
  primary: {
    backgroundColor: Colors.primary.main,
  },
  disabled: {
    backgroundColor: Colors.dark.backgroundLight,
  },
  secondary: {
    backgroundColor: Colors.dark.backgroundLight,
  },
  error: {
    backgroundColor: Colors.dark.backgroundLight,
  },
  secondaryDark: {
    backgroundColor: Colors.dark.background,
  },
  text: {
    backgroundColor: "none",
  },
  outlined: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: Colors.secondary.dark,
  },
  contained: {
    borderColor: "transparent",
  },
  absoluteLeft: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
  },
  absoluteRight: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
  },
});

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "contained",
  startIcon,
  endIcon,
  onPress = () => {},
  style,
  cornerIcon = false,
  color = "primary",
  disabled = false,
}) => {
  const getTextColor = () => {
    if (color === "error") return "error";
    if (disabled) return "textSecondary";
    if (variant === "outlined") return Colors.secondary.main;
    return "textPrimary";
  };

  return (
    <TouchableOpacity
      disabled={disabled}
      style={[
        styles.button,
        styles[color],
        styles[variant],
        style,
        disabled && styles.disabled,
      ]}
      testID="button"
      onPress={onPress}
    >
      <Box
        direction="row"
        align="center"
        justify="center"
        fullWidth={variant !== "text"}
        gap={cornerIcon ? 0 : 12}
      >
        <Box style={{ ...(cornerIcon ? styles.absoluteLeft : {}) }}>
          {startIcon}
        </Box>
        <Text
          variant="button"
          color={getTextColor()}
          ellipsizeMode="clip"
          style={{ textTransform: "uppercase" }}
        >
          {children}
        </Text>
        <Box style={{ ...(cornerIcon ? styles.absoluteRight : {}) }}>
          {endIcon}
        </Box>
      </Box>
    </TouchableOpacity>
  );
};
