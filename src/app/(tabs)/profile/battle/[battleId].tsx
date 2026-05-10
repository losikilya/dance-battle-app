import Colors from "@constants/Colors";
import { Box } from "@components";
import { HEADER_HEIGHT } from "@constants/Dimensions";
import {
  Redirect,
  useGlobalSearchParams,
  useLocalSearchParams,
} from "expo-router";

export default function CampaignScreen(): React.JSX.Element {
  const glob = useGlobalSearchParams<{ battleId?: string }>();
  const { accountId } = useLocalSearchParams<{
    accountId: string;
  }>();

  const battleId = glob.battleId === "null" ? null : glob.battleId;

  if (!accountId) {
    return <Redirect href="/(tabs)/profile" />;
  }

  return (
    <Box
      pt={HEADER_HEIGHT}
      color={Colors.dark.background}
      style={{ flex: 1 }}
    ></Box>
  );
}
