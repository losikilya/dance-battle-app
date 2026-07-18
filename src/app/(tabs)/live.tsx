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
  const hasMcRole = useSessionStore(s => s.hasRole('mc'));
  const hasSpectatorRole = useSessionStore(s => s.hasRole('spectator'));
  const hasHostRole = useSessionStore(s => s.hasRole('host'));
  const status = useJudgingClientStore(s => s.status);
  const serverAddress = useJudgingClientStore(s => s.serverAddress);
  const connectionRole = useJudgingClientStore(s => s.role);
  const hasRemoteLiveRole = !hasHostRole && (hasMcRole || hasSpectatorRole);
  const canRenderRemoteMc =
    !hasHostRole && hasMcRole && connectionRole === 'mc';
  const canRenderRemoteSpectator =
    !hasHostRole && hasSpectatorRole && connectionRole === 'spectator';

  if (!hasRemoteLiveRole) {
    return (
      <Box fullHeight color={Colors.dark.background} align="center" justify="center" px={24}>
        <Text variant="body2" color="textSecondary" centered>
          {getResource('live_tab_mc_only')}
        </Text>
      </Box>
    );
  }

  if (status === 'connected') {
    if (canRenderRemoteMc) return <MCDashboardScreen />;
    if (canRenderRemoteSpectator) return <SpectatorLiveScreen />;

    return (
      <Box fullHeight color={Colors.dark.background} align="center" justify="center" px={24}>
        <Text variant="body2" color="textSecondary" centered>
          Connect again using the selected role.
        </Text>
      </Box>
    );
  }

  if (serverAddress !== null) {
    return <ConnectionLostScreen />;
  }

  return <JudgeConnectScreen />;
}
