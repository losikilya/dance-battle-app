import { StyleSheet, View } from 'react-native';
import { Box, Text } from '@components';
import Colors from '@constants/Colors';
import { getResource } from '@resources';
import { Participant } from '@domain/participant/types';

type DancerCardProps = {
  participant: Participant;
  isWinner: boolean;
};

export const DancerCard: React.FC<DancerCardProps> = ({ participant, isWinner }) => (
  <Box
    style={isWinner ? { ...styles.card, ...styles.winnerCard } : { ...styles.card, ...styles.loserCard }}
    gap={12}
    p={16}
  >
    {isWinner && (
      <Box style={styles.winnerBadge} px={10} py={4}>
        <Text variant="body2" color="dark">{getResource('result_winner_badge')}</Text>
      </Box>
    )}
    <View style={[styles.photoPlaceholder, isWinner ? styles.photoWinner : styles.photoLoser]} />
    <Text variant="h2">{participant.name}</Text>
    {participant.city !== undefined && (
      <Text variant="body2" color="textSecondary">
        {getResource('result_representing_prefix')} {participant.city}
      </Text>
    )}
  </Box>
);

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 2,
    overflow: 'hidden',
  },
  winnerCard: {
    borderColor: Colors.status.online,
    backgroundColor: 'rgba(55,254,17,0.05)',
  },
  loserCard: {
    borderColor: Colors.border.subtle,
    backgroundColor: Colors.dark.backgroundLight,
  },
  winnerBadge: {
    backgroundColor: Colors.status.online,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  photoPlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  photoWinner: {
    backgroundColor: 'rgba(55,254,17,0.1)',
  },
  photoLoser: {
    backgroundColor: Colors.dark.background,
  },
});
