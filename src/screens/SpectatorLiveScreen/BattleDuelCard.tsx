import { StyleSheet } from 'react-native';
import { Box, Text } from '@components';
import Colors from '@constants/Colors';
import { getResource } from '@resources';
import type { Participant } from '@domain/participant/types';
import type { BattleRound } from '@domain/battle/types';

const ROUND_LABELS: Record<BattleRound, string> = {
  top8: 'ROUND 1/3',
  semifinal: 'ROUND 2/3',
  final: 'ROUND 3/3',
};

type BattleDuelCardProps = {
  participantA: Participant | undefined;
  participantB: Participant | undefined;
  round: BattleRound;
};

export const BattleDuelCard: React.FC<BattleDuelCardProps> = ({
  participantA,
  participantB,
  round,
}) => (
  <Box style={styles.card} p={16} gap={16}>
    <Box align="center" gap={8}>
      <Box style={{ ...styles.photoCircle, ...styles.photoCircleCyan }} align="center" justify="center">
        <Text variant="h2" color="primary">
          {participantA?.name.charAt(0).toUpperCase() ?? '?'}
        </Text>
      </Box>
      <Text variant="bodyBold">{participantA?.name ?? '—'}</Text>
      <Text variant="body2" color="textSecondary">
        {`${getResource('spectator_origin_prefix')} ${participantA?.city ?? '—'}`}
      </Text>
    </Box>

    <Box align="center" gap={4}>
      <Box style={styles.vsBadge} px={16} py={6}>
        <Text variant="bodyBold">VS</Text>
      </Box>
      <Text variant="body2" color="textSecondary">{ROUND_LABELS[round]}</Text>
    </Box>

    <Box align="center" gap={8}>
      <Box style={{ ...styles.photoCircle, ...styles.photoCirclePurple }} align="center" justify="center">
        <Text variant="h2" style={styles.purpleText}>
          {participantB?.name.charAt(0).toUpperCase() ?? '?'}
        </Text>
      </Box>
      <Text variant="bodyBold">{participantB?.name ?? '—'}</Text>
      <Text variant="body2" color="textSecondary">
        {`${getResource('spectator_origin_prefix')} ${participantB?.city ?? '—'}`}
      </Text>
    </Box>

    <Box direction="row" align="center" gap={8} mt={4}>
      <Box style={styles.liveDot} />
      <Text variant="body2" color="primary">{getResource('spectator_live_broadcast')}</Text>
      <Box style={styles.broadcastBar} flex={1}>
        <Box style={styles.broadcastFill} />
      </Box>
    </Box>
  </Box>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.dark.backgroundLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  photoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    backgroundColor: Colors.dark.background,
  },
  photoCircleCyan: {
    borderColor: Colors.primary.main,
  },
  photoCirclePurple: {
    borderColor: Colors.secondary.main,
  },
  purpleText: {
    color: Colors.secondary.main,
  },
  vsBadge: {
    backgroundColor: Colors.dark.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary.main,
  },
  broadcastBar: {
    height: 4,
    backgroundColor: Colors.dark.background,
    borderRadius: 2,
    overflow: 'hidden',
  },
  broadcastFill: {
    width: '60%',
    height: 4,
    backgroundColor: Colors.primary.main,
    borderRadius: 2,
  },
});
