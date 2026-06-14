import { StyleSheet, View } from 'react-native';
import { Box, Text } from '@components';
import Colors from '@constants/Colors';

type ParticipantStatsBarProps = {
  label: string;
  value: number;
};

export const ParticipantStatsBar: React.FC<ParticipantStatsBarProps> = ({ label, value }) => (
  <Box gap={6}>
    <Box direction="row" justify="space-between">
      <Text variant="body2" color="textSecondary">{label}</Text>
      <Text variant="body2" color="textSecondary">{Math.round(value)}% COMPLETED</Text>
    </Box>
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${Math.min(value, 100)}%` }]} />
    </View>
  </Box>
);

const styles = StyleSheet.create({
  track: {
    height: 4,
    backgroundColor: Colors.dark.backgroundLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: Colors.primary.main,
    borderRadius: 2,
  },
});
