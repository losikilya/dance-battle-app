import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  TextInput,
  Pressable,
  TextInputProps,
  Keyboard,
  TouchableWithoutFeedback,
  TextInputChangeEvent,
} from "react-native";
import Colors from "@constants/Colors";

import { Box } from "../Box";

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginTop: 42, // distance for label
    gap: 8,
  },
  label: {
    color: Colors.text.placeholder,
    fontSize: 14,
    fontWeight: "600",
  },
  root: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderRadius: 12,
    borderColor: "rgba(255,255,255,0.5)",
    fontSize: 24,
    fontWeight: "600",
    lineHeight: 32,
    includeFontPadding: false, // Android
    letterSpacing: 0.84,
    backgroundColor: "black",
    color: "white",
    fontFamily: "HauoraBold",
  },
  inputFocused: {
    borderColor: Colors.primary.light,
  },
});

export const Input: React.FC<
  TextInputProps & { label: string; innerRef?: React.RefObject<TextInput> }
> = ({
  innerRef,
  style,
  value,
  placeholderTextColor = Colors.text.secondary,
  label,
  onFocus,
  onBlur,
  onChangeText,
  defaultValue = "",
  ...props
}) => {
  const isControlled = value !== undefined;

  const [internalValue, setInternalValue] = useState(defaultValue);

  const currentValue = isControlled ? value : internalValue;

  const [focused, setFocused] = useState(false);

  const animated = useRef(new Animated.Value(currentValue ? 1 : 0)).current;

  const animate = (toValue: number) => {
    Animated.timing(animated, {
      toValue,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleFocus = (e: any) => {
    setFocused(true);
    animate(1);
    onFocus?.(e);
  };

  const handleChangeText = (text: string) => {
    if (!isControlled) {
      setInternalValue(text);
    }
    onChangeText?.(text);
  };

  const handleBlur = (e: any) => {
    setFocused(false);
    if (!currentValue) {
      animate(0);
    }

    onBlur?.(e);
  };

  const labelStyle = {
    position: "absolute" as const,

    left: 12,

    top: animated.interpolate({
      inputRange: [0, 1],
      outputRange: [18, -24],
    }),

    fontSize: animated.interpolate({
      inputRange: [0, 1],
      outputRange: [24, 12],
    }),

    color: animated.interpolate({
      inputRange: [0, 1],
      outputRange: [Colors.text.placeholder, Colors.primary.light],
    }),

    paddingHorizontal: 4,
    zIndex: 10,
    elevation: 10,
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <Box style={styles.container}>
        {label && (
          <Animated.Text style={labelStyle} pointerEvents="none">
            {label}
          </Animated.Text>
        )}

        <TextInput
          ref={innerRef}
          placeholderTextColor={placeholderTextColor}
          style={[styles.root, focused && styles.inputFocused, style]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChangeText={handleChangeText}
          {...props}
        />
      </Box>
    </TouchableWithoutFeedback>
  );
};
