import React, { memo, useEffect, useRef, useState } from "react";
import { Image } from "expo-image";
import { StyleSheet } from "react-native";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "@constants/Dimensions";
import Colors from "@constants/Colors";
import { getResource } from "@resources";

import { Box } from "../Box";
import { Text } from "../Text";

type BackgroundProps = {
  uri: string;
  visible?: boolean;
  prefetchUris?: Array<string | undefined>;
  Placeholder?: React.JSX.Element;
};

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 48,
  },
  image: {
    borderRadius: 48,
  },
});

export const Background: React.FC<BackgroundProps> = memo(
  ({ uri, visible = true, Placeholder }) => {
    const [isValid, setIsValid] = useState<boolean>(true);
    const isMountedRef = useRef(true);

    useEffect(() => {
      isMountedRef.current = true;

      return () => {
        isMountedRef.current = false;
      };
    }, []);

    if (!isValid) {
      if (Placeholder) {
        return Placeholder;
      }

      return (
        <Box
          key={uri}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: visible ? 2 : 1,
            backgroundColor: Colors.dark.backgroundLight,
          }}
          align="center"
          justify="center"
        >
          <Text color="textSecondary">{getResource("content_not_found")}</Text>
        </Box>
      );
    }

    return (
      <Image
        onError={() => setIsValid(false)}
        key={uri}
        source={uri}
        contentFit="cover"
        style={{ ...styles.root, zIndex: visible ? 2 : 1 }}
      />
    );
  },
);
