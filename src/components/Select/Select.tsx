import React, { useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import Colors from "@constants/Colors";

import { Box } from "../Box";
import { Text } from "../Text";

type Option = {
  label: string;
  value: string;
};

type Props = {
  label?: string;
  value?: string;
  options?: Option[];
  defaultValue?: string;
  onChange?: (value: string) => void;
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginTop: 42, // distance for label
    position: "relative",
  },

  select: {
    minHeight: 72,

    paddingVertical: 0,
    paddingHorizontal: 24,

    borderWidth: 1,
    borderRadius: 12,
    borderColor: "rgba(255,255,255,0.5)",

    backgroundColor: "black",

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  selectFocused: {
    borderColor: Colors.primary.light,
  },

  value: {
    fontSize: 24,
    color: "white",
    fontFamily: "HauoraBold",
    fontWeight: "600",
    lineHeight: 32,
  },

  placeholder: {
    color: Colors.text.secondary,
  },

  chevron: {
    color: "white",
    fontSize: 24,
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 24,
  },

  dropdown: {
    backgroundColor: "#111",
    borderRadius: 16,
    overflow: "hidden",
  },

  option: {
    padding: 20,
  },

  optionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
});

export const Select: React.FC<Props> = ({
  label,
  value: controlledValue,
  options = [],
  defaultValue = "",
  onChange,
}) => {
  const isControlled = controlledValue !== undefined;

  const [internalValue, setInternalValue] = useState(defaultValue);

  const value = isControlled ? controlledValue : internalValue;

  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);

  const selected = options.find((item) => item.value === value);

  const animated = useRef(new Animated.Value(value ? 1 : 0)).current;

  const animate = (toValue: number) => {
    Animated.timing(animated, {
      toValue,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleOpen = () => {
    setFocused(true);
    setOpen(true);
    animate(1);
  };

  const handleClose = () => {
    setFocused(false);
    setOpen(false);

    if (!value) {
      animate(0);
    }
  };

  const handleSelect = (next: string) => {
    if (!isControlled) {
      setInternalValue(next);
    }
    onChange?.(next);
    setOpen(false);
    setFocused(false);

    animate(1);
  };

  const labelStyle = {
    position: "absolute" as const,

    left: 12,

    top: animated.interpolate({
      inputRange: [0, 1],
      outputRange: [22, -24],
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
  };

  return (
    <>
      <Box style={styles.container}>
        {label && (
          <Animated.Text pointerEvents="none" style={labelStyle}>
            {label}
          </Animated.Text>
        )}

        <Pressable
          onPress={handleOpen}
          style={[styles.select, focused && styles.selectFocused]}
        >
          <Text style={[styles.value, !selected && styles.placeholder]}>
            {selected?.label || ""}
          </Text>

          <Ionicons
            style={styles.chevron}
            name="chevron-down-outline"
            size={24}
            color="black"
          />
        </Pressable>
      </Box>

      <Modal transparent visible={open} animationType="fade">
        <Pressable style={styles.overlay} onPress={handleClose}>
          <View style={styles.dropdown}>
            {options.map((option, index) => {
              const isLast = index === options.length - 1;
              return (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => handleSelect(option.value)}
                  style={[styles.option, !isLast && styles.optionBorder]}
                >
                  <Text>{option.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
};
