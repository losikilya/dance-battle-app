import { StyleSheet, View } from 'react-native';
import { Box, Text } from '@components';
import Colors from '@constants/Colors';
import { getResource } from '@resources';
import { useJudgingServerStore } from '@stores/judgingServer/useJudgingServerStore';

const BAR_HEIGHTS = [8, 16, 12, 20, 10];

const ServerRow: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <Box direction="row" justify="space-between">
    <Text variant="body2" color="textSecondary">
      {label}
    </Text>
    <Text variant="body2">{value}</Text>
  </Box>
);

export const ServerStatusCard: React.FC = () => {
  const status = useJudgingServerStore(s => s.status);
  const connectionInfo = useJudgingServerStore(s => s.connectionInfo);
  const port = useJudgingServerStore(s => s.port);
  const lastError = useJudgingServerStore(s => s.lastError);
  const isOnline = status === 'running';

  return (
    <Box style={styles.card} p={20} gap={16}>
      <Box direction="row" justify="space-between" align="center">
        <Text variant="bodyBold">{getResource('dashboard_server_title')}</Text>
        <Box
          style={{
            ...styles.badge,
            backgroundColor: isOnline
              ? Colors.status.online
              : Colors.text.secondary,
          }}
          px={8}
          py={4}
        >
          <Text variant="body2" color="dark">
            {isOnline
              ? getResource('dashboard_server_online')
              : getResource('dashboard_server_offline')}
          </Text>
        </Box>
      </Box>
      <Box gap={8}>
        <ServerRow
          label={getResource('dashboard_server_ip')}
          value={connectionInfo?.host ?? '-'}
        />
        <ServerRow
          label={getResource('dashboard_server_port')}
          value={String(connectionInfo?.port ?? port)}
        />
        {isOnline && connectionInfo !== null && (
          <ServerRow
            label={getResource('dashboard_server_local')}
            value={connectionInfo.address}
          />
        )}
        {lastError && <ServerRow label="Network" value={lastError} />}
        <ServerRow
          label={getResource('dashboard_server_health')}
          value={getResource('dashboard_server_health_value')}
        />
        <ServerRow label={getResource('dashboard_server_uptime')} value="-" />
      </Box>
      <Box direction="row" align="flex-end" gap={4} style={styles.bars}>
        {BAR_HEIGHTS.map((h, i) => (
          <View key={i} style={[styles.bar, { height: h }]} />
        ))}
      </Box>
    </Box>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.dark.backgroundLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  badge: {
    borderRadius: 6,
  },
  bars: {
    height: 24,
  },
  bar: {
    width: 6,
    backgroundColor: Colors.text.secondary,
    borderRadius: 2,
  },
});
