import { useSessionStore } from '@stores/session/useSessionStore';
import { useJudgingClientStore } from '@stores/judgingClient/useJudgingClientStore';
import { MCDashboardScreen } from '@screens/MCDashboardScreen';
import { SpectatorLiveScreen } from '@screens/SpectatorLiveScreen';
import { ConnectionLostScreen } from '@screens/ConnectionLostScreen';
import { JudgeConnectScreen } from '@screens/JudgeConnectScreen';
import { Box, Text } from '@components';
import Colors from '@constants/Colors';
import { getResource } from '@resources';

export default function LiveTab(): React.JSX.Element {
  const role = useSessionStore(s => s.role);
  const status = useJudgingClientStore(s => s.status);
  const serverAddress = useJudgingClientStore(s => s.serverAddress);

  if (role !== 'mc' && role !== 'spectator') {
    return (
      <Box fullHeight color={Colors.dark.background} align="center" justify="center" px={24}>
        <Text variant="body2" color="textSecondary" centered>
          {getResource('live_tab_mc_only')}
        </Text>
      </Box>
    );
  }

  if (status === 'connected') {
    if (role === 'mc') return <MCDashboardScreen />;
    return <SpectatorLiveScreen />;
  }

  if (serverAddress !== null) {
    return <ConnectionLostScreen />;
  }

  return <JudgeConnectScreen />;
}
