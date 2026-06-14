import { StyleSheet } from 'react-native';
import { Box, Text } from '@components';
import Colors from '@constants/Colors';
import { getResource } from '@resources';
import { useDemoBattleStore } from '@stores/demoBattle/useDemoBattleStore';

export const SystemLogsCard: React.FC = () => {
  const systemLogs = useDemoBattleStore(s => s.systemLogs);

  return (
    <Box style={styles.card} p={20} gap={12}>
      <Text variant="bodyBold">{getResource('dashboard_logs_title')}</Text>
      <Box gap={6}>
        {systemLogs.length === 0 ? (
          <Text variant="body2" color="textSecondary">No events yet.</Text>
        ) : (
          [...systemLogs].reverse().map((log, i) => (
            <Text key={i} variant="body2" color="textSecondary">{log}</Text>
          ))
        )}
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
});
