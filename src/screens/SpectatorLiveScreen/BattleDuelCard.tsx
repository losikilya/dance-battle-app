import { StyleSheet } from 'react-native';
import { Box, Text } from '@components';
import Colors from '@constants/Colors';
import { getResource } from '@resources';
import type { BattleRound } from '@domain/battle/types';
import type { BattleParticipantDisplayRow } from '@screens/shared/battleDisplay';

const ROUND_LABELS: Record<BattleRound, string> = {
  custom: getResource('bracket_round_custom'),
  top32: getResource('bracket_round_top32'),
  top16: getResource('bracket_round_top16'),
  top8: getResource('bracket_round_top8'),
  semifinal: getResource('bracket_round_semifinal'),
  final: getResource('bracket_round_final'),
};

type BattleDuelCardProps = {
  participants: BattleParticipantDisplayRow[];
  round: BattleRound;
  broadcastLabel?: string;
  isLive?: boolean;
};

export const BattleDuelCard: React.FC<BattleDuelCardProps> = ({
  participants,
  round,
  broadcastLabel = getResource('spectator_live_broadcast'),
  isLive = true,
}) => {
  const accentStyles = [styles.photoCircleCyan, styles.photoCirclePurple];

  return (
    <Box style={styles.card} p={16} gap={16}>
      <Box align="center" gap={4}>
        <Box style={styles.vsBadge} px={16} py={6}>
          <Text variant="bodyBold">VS</Text>
        </Box>
        <Text variant="body2" color="textSecondary">{ROUND_LABELS[round]}</Text>
      </Box>

      {participants.map((row, index) => (
        <Box key={row.participantId} align="center" gap={8}>
          <Box
            style={{
              ...styles.photoCircle,
              ...accentStyles[index % accentStyles.length],
            }}
            align="center"
            justify="center"
          >
            <Text
              variant="h2"
              color={index % 2 === 0 ? 'primary' : undefined}
              style={index % 2 === 0 ? undefined : styles.purpleText}
            >
              {row.name.charAt(0).toUpperCase()}
            </Text>
          </Box>
          <Text variant="bodyBold">{row.name}</Text>
          <Text variant="body2" color="textSecondary">
            {`${getResource('spectator_origin_prefix')} ${row.participant?.city ?? '-'}`}
          </Text>
        </Box>
      ))}

      <Box direction="row" align="center" gap={8} mt={4}>
        <Box style={isLive ? styles.liveDot : styles.resultDot} />
        <Text variant="body2" color={isLive ? 'primary' : 'textSecondary'}>{broadcastLabel}</Text>
        <Box style={styles.broadcastBar} flex={1}>
          <Box style={isLive ? styles.broadcastFill : styles.resultFill} />
        </Box>
      </Box>
    </Box>
  );
};

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
  resultDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.text.secondary,
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
  resultFill: {
    width: '100%',
    height: 4,
    backgroundColor: Colors.text.secondary,
    borderRadius: 2,
  },
});
