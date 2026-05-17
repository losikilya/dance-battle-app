import {
  Avatar,
  AvatarStack,
  Box,
  Button,
  Card,
  IconButton,
  List,
  ListItem,
  Text,
} from "@components";
import Ionicons from "@expo/vector-icons/Ionicons";
import { HEADER_HEIGHT } from "@constants/Dimensions";
import Colors from "@constants/Colors";
import { CreateEventScreen } from "@screens/CreateEventScreen/CreateEventScreen";

export default function Event(): React.JSX.Element {
  return (
    <Box pt={56} px={24} fullHeight fullWidth color={Colors.dark.background}>
      <CreateEventScreen />
    </Box>
  );
}
