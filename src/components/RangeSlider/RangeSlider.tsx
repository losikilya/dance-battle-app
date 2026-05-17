import React, { useRef, useState } from "react";
import { View, Text, StyleSheet, LayoutChangeEvent } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Colors from "@constants/Colors";

type Props = {
  min?: number;
  max?: number;
  step?: number;
  initialMin?: number;
  initialMax?: number;
  label?: string;
  onChange?: (min: number, max: number) => void;
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderRadius: 12,
    borderColor: "rgba(255,255,255,0.5)",
    gap: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label: {
    color: Colors.text.placeholder,
    fontSize: 14,
    fontWeight: "600",
  },
  value: {
    color: Colors.primary.light,
    fontSize: 14,
    fontWeight: "700",
  },
  track: {
    height: 40,
    justifyContent: "center",
    paddingRight: 12,
  },
  range: {
    position: "absolute",
    height: 4,
    backgroundColor: Colors.primary.light,
    borderRadius: 2,
  },
  thumb: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary.light,
    borderWidth: 3,
    borderColor: "black",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  minMax: {
    color: Colors.text.placeholder,
    fontSize: 12,
    fontWeight: "600",
  },
});

export const RangeSlider: React.FC<Props> = ({
  min = 1,
  max = 10,
  step = 1,
  initialMin = 1,
  initialMax = 10,
  label = "RANGE",
  onChange,
}) => {
  const width = useRef(0);

  const minX = useRef(0);
  const maxX = useRef(0);

  const [minVal, setMinVal] = useState(initialMin);
  const [maxVal, setMaxVal] = useState(initialMax);

  const raf = useRef<number | null>(null);

  const clamp = (v: number, a: number, b: number) =>
    Math.min(Math.max(v, a), b);

  const snap = (v: number) => Math.round(v / step) * step;

  const valueToX = (v: number) => ((v - min) / (max - min)) * width.current;

  const xToValue = (x: number) => {
    const raw = (x / width.current) * (max - min) + min;
    return snap(clamp(raw, min, max));
  };

  const scheduleUpdate = (fn: () => void) => {
    if (raf.current) return;
    raf.current = requestAnimationFrame(() => {
      raf.current = null;
      fn();
    });
  };

  const onLayout = (e: LayoutChangeEvent) => {
    width.current = e.nativeEvent.layout.width;

    minX.current = valueToX(initialMin);
    maxX.current = valueToX(initialMax);
  };

  const update = () => {
    setMinVal(xToValue(minX.current));
    setMaxVal(xToValue(maxX.current));
  };

  const panMin = Gesture.Pan().onChange((e) => {
    scheduleUpdate(() => {
      const next = clamp(minX.current + e.changeX, 0, maxX.current - 20);

      minX.current = next;
      update();

      onChange?.(xToValue(next), maxVal);
    });
  });

  const panMax = Gesture.Pan().onChange((e) => {
    scheduleUpdate(() => {
      const next = clamp(
        maxX.current + e.changeX,
        minX.current + 20,
        width.current,
      );

      maxX.current = next;
      update();

      onChange?.(minVal, xToValue(next));
    });
  });

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>
          {minVal} - {maxVal}
        </Text>
      </View>

      {/* TRACK */}
      <View style={styles.track} onLayout={onLayout}>
        <View
          style={[
            styles.range,
            {
              left: minX.current,
              width: maxX.current - minX.current,
            },
          ]}
        />

        <GestureDetector gesture={panMin}>
          <View style={[styles.thumb, { left: minX.current }]} />
        </GestureDetector>

        <GestureDetector gesture={panMax}>
          <View style={[styles.thumb, { left: maxX.current }]} />
        </GestureDetector>
      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        <Text style={styles.minMax}>MIN</Text>
        <Text style={styles.minMax}>MAX</Text>
      </View>
    </View>
  );
};
