import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Colors from "@constants/Colors";

import { Card } from "../Cards";
import { Text } from "../Text";

type Option = {
  label: string;
  value: string;
};

type Props = {
  value?: string | number;
  label?: string;
  defaultValue?: string;
  options: Option[];
  onChange?: (value: string) => void;
};

export const CardSelect: React.FC<Props> = ({
  value: controlledValue,
  label,
  defaultValue,
  options,
  onChange,
}) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue);

  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const handleSelect = (val: string) => {
    if (controlledValue === undefined) {
      setInternalValue(val);
    }
    onChange?.(val);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={styles.row}>
        {options.map((option) => {
          const selected = String(option.value) === String(value);

          return (
            <Pressable
              key={option.value}
              onPress={() => handleSelect(option.value)}
              style={styles.item}
            >
              <Card dark style={[styles.card, selected && styles.selectedCard]}>
                <Text
                  color={selected ? Colors.primary.main : "textPrimary"}
                  centered
                >
                  {option.label}
                </Text>
              </Card>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 32,
    width: "100%",
    gap: 12,
  },

  label: {
    color: Colors.secondary.light,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },

  item: {
    flex: 1,
  },
  card: {
    justifyContent: "center",
    alignItems: "center",

    borderWidth: 1,
    borderRadius: 12,
    borderColor: "rgba(255,255,255,0.5)",
  },

  selectedCard: {
    borderColor: Colors.primary.light,
    borderWidth: 2,
  },
});
