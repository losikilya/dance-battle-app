import { View } from "react-native";
import Colors from "@constants/Colors";
import { Box, Header } from "@components";

export default function Settings(): React.JSX.Element {
  return (
    <View style={{ backgroundColor: Colors.primary.main, flex: 1 }}>
      <Box p={24} pt={48} mt={24} gap={24}>
        <Header />
      </Box>
    </View>
  );
}
