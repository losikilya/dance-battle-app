import { StyleSheet } from 'react-native';
import { Box, Text } from '@components';
import Ionicons from '@expo/vector-icons/Ionicons';
import Colors from '@constants/Colors';
import { getResource } from '@resources';
import { useBattleState } from '@stores/battle/useBattleState';
import { calculateRanking } from '@domain/qualification/calculateRanking';

const DELTAS = ['+12%', '+8%', '-3%'];

export const PowerRankingsWidget: React.FC = () => {
  const { state } = useBattleState();
  const participants = state?.participants ?? [];
  const scores = state?.scores ?? [];
  const top3 = calculateRanking({ participants, scores }).slice(0, 3);

  return (
    <Box style={styles.card} p={20} gap={12}>
      <Box direction="row" align="center" gap={8}>
        <Ionicons name="trophy-outline" size={16} color={Colors.primary.main} />
        <Text variant="bodyBold">{getResource('bracket_power_title')}</Text>
      </Box>
      <Box gap={8}>
        {top3.map((item, i) => {
          const participant = participants.find(p => p.id === item.participantId);
          const displayName = participant?.name ?? 'Unknown';
          const delta = DELTAS[i] ?? '';
          const isPositive = delta.startsWith('+');
          return (
            <Box key={item.participantId} direction="row" align="center" justify="space-between">
              <Box direction="row" align="center" gap={8}>
                <Text variant="bodyBold" color="primary">{String(item.rank).padStart(2, '0')}</Text>
                <Text variant="body" numberOfLines={1}>{displayName}</Text>
              </Box>
              <Text variant="body2" color={isPositive ? 'primary' : 'textSecondary'}>
                {delta}
              </Text>
            </Box>
          );
        })}
        {top3.length === 0 && (
          <Text variant="body2" color="textSecondary">No rankings yet.</Text>
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
