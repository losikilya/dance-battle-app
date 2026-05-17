import { Text as DefaultText, StyleSheet } from "react-native";
import Colors from "@constants/Colors";

import { Color, StyledTextProps } from "./types";

const styles = StyleSheet.create({
  h1: {
    fontSize: 32,
    fontWeight: "800",
    lineHeight: 48,
    fontFamily: "HauoraExtraBold",
    letterSpacing: 3.2,
    textTransform: "uppercase",
  },
  h2: {
    fontSize: 28,
    fontWeight: "600",
    lineHeight: 42,
    fontFamily: "HauoraBold",
    letterSpacing: 0.84,
  },
  body: {
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 24,
    fontFamily: "HauoraRegular",
    letterSpacing: 0.96,
  },
  bodyBold: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 24,
    fontFamily: "HauoraBold",
    letterSpacing: 0.96,
  },
  body2: {
    fontSize: 12,
    fontWeight: "400",
    lineHeight: 18,
    fontFamily: "HauoraRegular",
    letterSpacing: 0.96,
  },
  button: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 24,
    fontFamily: "HauoraBold",
    letterSpacing: 0.64,
  },
  caption: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 24,
    fontFamily: "HauoraBold",
    letterSpacing: 0.64,
  },
  primary: {
    color: Colors.primary.main,
  },
  secondary: {
    color: Colors.secondary.main,
  },
  error: {
    color: Colors.text.error,
  },
  textPrimary: {
    color: Colors.text.primary,
  },
  textSecondary: {
    color: Colors.text.secondary,
  },
  dark: {
    color: Colors.dark.text,
  },
  contrast: {
    color: Colors.secondary.contrastText,
  },
});

export const Text: React.FC<StyledTextProps> = ({
  variant = "body",
  color = "textPrimary",
  centered = false,
  style,
  contrast = false,
  children,
  ellipsizeMode,
  numberOfLines,
}) => {
  return (
    <DefaultText
      style={[
        styles[variant],
        color in styles ? styles[color as Color] : { color },
        contrast && styles.contrast,
        { textAlign: centered ? "center" : "left" },
        style,
      ]}
      ellipsizeMode={ellipsizeMode}
      numberOfLines={numberOfLines}
    >
      {children}
    </DefaultText>
  );
};
