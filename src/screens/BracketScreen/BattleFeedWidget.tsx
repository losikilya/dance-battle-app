import { StyleSheet } from 'react-native';
import { Box, Text } from '@components';
import Ionicons from '@expo/vector-icons/Ionicons';
import Colors from '@constants/Colors';
import { getResource } from '@resources';

const DEMO_FEED = [
  { text: 'Battle #1 started — Top 8', time: '00:01' },
  { text: 'Judge score submitted', time: '00:02' },
  { text: 'Battle #2 started — Top 8', time: '00:03' },
  { text: 'Participant qualified for semis', time: '00:04' },
  { text: 'Bracket updated', time: '00:05' },
];

export const BattleFeedWidget: React.FC = () => (
  <Box style={styles.card} p={20} gap={12}>
    <Box direction="row" justify="space-between" align="center">
      <Text variant="bodyBold">LIVE FEED</Text>
      <Box style={styles.onAirBadge} px={8} py={4}>
        <Text variant="body2" color="dark">{getResource('bracket_feed_label')}</Text>
      </Box>
    </Box>
    <Box gap={8}>
      {DEMO_FEED.map((item, i) => (
        <Box key={i} direction="row" justify="space-between" align="center">
          <Text variant="body2" color="textSecondary" style={styles.feedText} numberOfLines={1}>{item.text}</Text>
          <Box direction="row" align="center" gap={4}>
            <Text variant="body2" color="textSecondary">{item.time}</Text>
            <Ionicons name="chevron-forward" size={12} color={Colors.text.secondary} />
          </Box>
        </Box>
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
  onAirBadge: {
    backgroundColor: Colors.status.online,
    borderRadius: 6,
  },
  feedText: {
    flex: 1,
    marginRight: 8,
  },
});
