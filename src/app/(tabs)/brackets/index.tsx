import { useDemoBattleStore } from '@stores/demoBattle/useDemoBattleStore';
import { BracketScreen } from '@screens/BracketScreen';
import { RankingsScreen } from '@screens/RankingsScreen';
import { Box, Text } from '@components';
import Colors from '@constants/Colors';
import { getResource } from '@resources';

export default function BracketsTab(): React.JSX.Element {
  const eventStatus = useDemoBattleStore(s => s.event.status);

  if (eventStatus === 'qualification_finished') {
    return <RankingsScreen />;
  }

  if (eventStatus === 'battle' || eventStatus === 'finished') {
    return <BracketScreen />;
  }

  return (
    <Box fullHeight color={Colors.dark.background} align="center" justify="center" px={24}>
      <Text variant="body2" color="textSecondary" centered>{getResource('bracket_placeholder')}</Text>
    </Box>
  );
}
