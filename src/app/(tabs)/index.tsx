import { Box } from "@components";
import { DemoBattleScreen } from "screens/DemoBattleScreen/DemoBattleScreen";

export default function HomeScreen(): React.JSX.Element {
  return (
    <Box fullHeight fullWidth pt={48} pb={100}>
      <DemoBattleScreen />
    </Box>
  );
}
