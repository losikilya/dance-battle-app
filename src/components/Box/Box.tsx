import React, { PropsWithChildren } from "react";
import { View } from "react-native";

import { BoxProps, SpacingProps } from "./types";

const spacingMap: Record<keyof SpacingProps, string | string[]> = {
  m: "margin",
  mt: "marginTop",
  mr: "marginRight",
  mb: "marginBottom",
  ml: "marginLeft",
  mx: ["marginLeft", "marginRight"],
  my: ["marginTop", "marginBottom"],
  p: "padding",
  pt: "paddingTop",
  pr: "paddingRight",
  pb: "paddingBottom",
  pl: "paddingLeft",
  px: ["paddingLeft", "paddingRight"],
  py: ["paddingTop", "paddingBottom"],
};

export const Box: React.FC<PropsWithChildren<BoxProps>> = ({
  gap = 0,
  display = "flex",
  direction = "column",
  align,
  justify,
  children,
  fullWidth,
  fullHeight,
  color,
  flex,
  style,
  ...props
}) => {
  const spacing = Object.entries(props).reduce(
    (acc: Record<string, string | number>, [key, value]) => {
      if (spacingMap[key as keyof SpacingProps]) {
        const typedKey = key as keyof SpacingProps;
        if (Array.isArray(spacingMap[typedKey])) {
          (spacingMap[typedKey] as string[]).forEach((prop) => {
            acc[prop] = value;
          });
        } else {
          acc[spacingMap[typedKey] as string] = value;
        }
      }

      return acc;
    },
    {},
  );

  const isNegativeGap = Number(gap) < 0;

  return (
    <View
      {...props}
      // Keep `style` prop always on last position
      style={{
        display,
        flexDirection: direction,
        alignItems: align,
        justifyContent: justify,
        gap,
        backgroundColor: color,
        height: fullHeight ? "100%" : "auto",
        width: fullWidth ? "100%" : "auto",
        flex,
        ...spacing,
        ...style,
      }}
    >
      {isNegativeGap
        ? React.Children.map(children, (child, i) => (
            <View style={{ marginLeft: i === 0 ? 0 : Number(gap) }}>
              {child}
            </View>
          ))
        : children}
    </View>
  );
};
