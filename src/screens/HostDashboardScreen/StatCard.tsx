import { StyleSheet } from 'react-native';
import { Box, Text } from '@components';
import Colors from '@constants/Colors';

type StatCardProps = {
  label: string;
  value: string | number;
  badge?: string;
  badgeColor?: string;
};

export const StatCard: React.FC<StatCardProps> = ({ label, value, badge, badgeColor }) => (
  <Box style={styles.card} p={16} gap={8} flex={1}>
    <Text variant="body2" color="textSecondary">{label}</Text>
    <Text variant="h2">{String(value)}</Text>
    {badge !== undefined && (
      <Box style={{ ...styles.badge, backgroundColor: badgeColor ?? Colors.primary.main }} px={8} py={4}>
        <Text variant="body2" color="dark">{badge}</Text>
      </Box>
    )}
  </Box>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.dark.backgroundLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  badge: {
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
});
