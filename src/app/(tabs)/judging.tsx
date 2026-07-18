import { JudgeQualificationScreen } from '@screens/JudgeQualificationScreen';
import { JudgeBattleVotingScreen } from '@screens/JudgeBattleVotingScreen';
import { JudgeConnectScreen } from '@screens/JudgeConnectScreen';
import { Box, Text } from '@components';
import Colors from '@constants/Colors';
import { useSessionStore } from '@stores/session/useSessionStore';
import { useJudgingClientStore } from '@stores/judgingClient/useJudgingClientStore';

export default function JudgingTab(): React.JSX.Element {
  const hasJudgeRole = useSessionStore(s => s.hasRole('judge'));
  const hasHostRole = useSessionStore(s => s.hasRole('host'));
  const status = useJudgingClientStore(s => s.status);
  const syncedState = useJudgingClientStore(s => s.syncedState);
  const eventStatus = syncedState?.event.status ?? 'draft';

  if (!hasJudgeRole || hasHostRole) {
    return (
      <Box fullHeight color={Colors.dark.background} align="center" justify="center" px={24}>
        <Text variant="body2" color="textSecondary" centered>
          Judging is only available for judges.
        </Text>
      </Box>
    );
  }

  if (status !== 'connected') {
    return <JudgeConnectScreen />;
  }

  if (eventStatus === 'qualification') {
    return <JudgeQualificationScreen />;
  }

  if (eventStatus === 'battle') {
    return <JudgeBattleVotingScreen />;
  }

  return (
    <Box fullHeight color={Colors.dark.background} align="center" justify="center" px={24}>
      <Text variant="body2" color="textSecondary" centered>
        Waiting for event to start...
      </Text>
    </Box>
  );
}
