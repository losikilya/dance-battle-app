import { StyleSheet } from 'react-native';
import { Box, Text } from '@components';
import Colors from '@constants/Colors';
import { getResource } from '@resources';

const DEMO_LOGS = [
  '[00:00:01] System initialized. Event loaded.',
  '[00:00:02] TCP server started on port 8080.',
  '[00:00:03] Waiting for participants and judges.',
];

export const SystemLogsCard: React.FC = () => (
  <Box style={styles.card} p={20} gap={12}>
    <Text variant="bodyBold">{getResource('dashboard_logs_title')}</Text>
    <Box gap={6}>
      {DEMO_LOGS.map((log, i) => (
        <Text key={i} variant="body2" color="textSecondary">{log}</Text>
      ))}
    </Box>
  </Box>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.dark.backgroundLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
});
