import { StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Box, Text, Button } from '@components';
import Colors from '@constants/Colors';
import { getResource } from '@resources';
import {
  useJudgingClientStore,
  MAX_RECONNECT_ATTEMPTS,
} from '@stores/judgingClient/useJudgingClientStore';

export const ConnectionLostScreen: React.FC = () => {
  const router = useRouter();
  const serverAddress = useJudgingClientStore(s => s.serverAddress);
  const reconnectAttempts = useJudgingClientStore(s => s.reconnectAttempts);
  const host = useJudgingClientStore(s => s.host);
  const port = useJudgingClientStore(s => s.port);
  const role = useJudgingClientStore(s => s.role);
  const name = useJudgingClientStore(s => s.name);
  const lastError = useJudgingClientStore(s => s.lastError);
  const connectToHost = useJudgingClientStore(s => s.connectToHost);
  const disconnect = useJudgingClientStore(s => s.disconnect);

  const handleRetry = () => {
    if (!host || !port || !role) return;
    connectToHost({ host, port, role, name: name ?? undefined });
  };

  const handleNetworkSettings = () => {
    disconnect();
    router.push('/scan-qr');
  };

  return (
    <Box
      fullHeight
      color={Colors.dark.background}
      align="center"
      justify="center"
      px={24}
      gap={24}
    >
      <Box style={styles.iconCard} p={20} align="center" justify="center">
        <Ionicons name="wifi-outline" size={64} color={Colors.text.error} />
      </Box>

      <Box direction="row" align="center" gap={8}>
        <Box style={styles.errorDot} />
        <Text variant="body2" style={styles.errorText}>
          {getResource('connection_lost_status')}
        </Text>
      </Box>

      <Text variant="h2" centered>
        {getResource('connection_lost_title')}
      </Text>

      <Text variant="body2" color="textSecondary" centered>
        {lastError ?? getResource('connection_lost_body')}
      </Text>

      <Box direction="row" gap={12}>
        <Box style={styles.infoChip} p={12} gap={4}>
          <Text variant="body2" color="textSecondary">
            {getResource('connection_lost_endpoint')}
          </Text>
          <Text variant="bodyBold" numberOfLines={1}>
            {serverAddress ?? '—'}
          </Text>
        </Box>
        <Box style={styles.infoChip} p={12} gap={4}>
          <Text variant="body2" color="textSecondary">
            {getResource('connection_lost_retry_attempt')}
          </Text>
          <Text variant="bodyBold">
            {String(reconnectAttempts).padStart(2, '0')} / {String(MAX_RECONNECT_ATTEMPTS).padStart(2, '0')}
          </Text>
        </Box>
      </Box>

      <Box gap={12} fullWidth>
        <Button onPress={handleRetry}>
          {getResource('connection_lost_retry_button')}
        </Button>
        <Button variant="outlined" color="secondary" onPress={handleNetworkSettings}>
          {getResource('connection_lost_settings_button')}
        </Button>
      </Box>
    </Box>
  );
};

const styles = StyleSheet.create({
  iconCard: {
    backgroundColor: Colors.dark.backgroundLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.text.error,
  },
  errorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.text.error,
  },
  errorText: {
    color: Colors.text.error,
  },
  infoChip: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
});
