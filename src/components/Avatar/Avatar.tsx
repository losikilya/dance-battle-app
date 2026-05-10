import React, { useState } from "react";
import { Image } from "expo-image";
import { TouchableOpacity } from "react-native";
import * as Linking from "expo-linking";
import Ionicons from "@expo/vector-icons/Ionicons";

import { AvatarPlaceholder } from "./AvatarPlaceholder";

type Size = "xlarge" | "large" | "medium" | "small";

type AvatarProps = {
  uri?: string;
  link?: string;
  size?: number | string | Size;
  squared?: boolean;
};

const sizeMap: Record<Size, number> = {
  xlarge: 98,
  large: 64,
  medium: 48,
  small: 40,
};

export const Avatar: React.FC<AvatarProps> = ({
  uri,
  link,
  size: rawSize = "small",
  squared,
}) => {
  const size = sizeMap[rawSize as Size] ?? rawSize;
  const [isValid, setIsValid] = useState<boolean>(true);

  if (!isValid) {
    return <AvatarPlaceholder size={size} />;
  }

  return (
    <TouchableOpacity
      disabled={!link}
      onPress={() => link && Linking.openURL(link)}
    >
      {uri ? (
        <Image
          key={uri}
          onError={() => setIsValid(false)}
          style={{
            width: size,
            height: size,
            borderRadius: squared ? size * 0.25 : 100,
          }}
          source={uri}
        />
      ) : (
        <Ionicons size={size} name="person-outline" />
      )}
    </TouchableOpacity>
  );
};
