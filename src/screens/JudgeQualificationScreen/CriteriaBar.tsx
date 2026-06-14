import { StyleSheet, View } from 'react-native';
import { Box, Text } from '@components';
import Colors from '@constants/Colors';

type CriteriaBarProps = {
  label: string;
  value: number;
};

export const CriteriaBar: React.FC<CriteriaBarProps> = ({ label, value }) => (
  <Box gap={4}>
    <Text variant="body2" color="textSecondary">{label}</Text>
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${Math.round(value * 100)}%` }]} />
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
