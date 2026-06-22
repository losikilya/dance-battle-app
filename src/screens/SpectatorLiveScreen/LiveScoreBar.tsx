import { StyleSheet } from 'react-native';
import { Box, Text } from '@components';
import Colors from '@constants/Colors';

type LiveScoreBarProps = {
  label: string;
  score: number;
  fill: number;
  color: string;
};

export const LiveScoreBar: React.FC<LiveScoreBarProps> = ({ label, score, fill, color }) => (
  <Box gap={6}>
    <Box direction="row" justify="space-between" align="center">
      <Text variant="bodyBold">{label}</Text>
      <Text variant="bodyBold" style={{ color }}>{score.toFixed(1)}</Text>
    </Box>
    <Box style={styles.track}>
      <Box
        style={{
          ...styles.fill,
          width: `${Math.min(fill, 1) * 100}%` as `${number}%`,
          backgroundColor: color,
        }}
      />
    </Box>
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
    height: 4,
    borderRadius: 2,
  },
});
