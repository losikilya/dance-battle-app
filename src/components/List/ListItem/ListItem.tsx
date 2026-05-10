import React, { PropsWithChildren, ReactNode } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";

import { Box } from "../../Box";

type ListItemProps = {
  icon?: ReactNode;
};

export const ListItem: React.FC<PropsWithChildren<ListItemProps>> = ({
  icon,
  children,
}) => {
  return (
    <Box py={24} align="center" direction="row" justify="space-between">
      {children}
      {icon ?? <Ionicons size={24} name="ellipsis-horizontal-outline" />}
    </Box>
  );
};
