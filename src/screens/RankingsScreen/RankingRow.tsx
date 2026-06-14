import { StyleSheet, View } from 'react-native';
import { Box, Text } from '@components';
import Colors from '@constants/Colors';
import { RankedParticipant } from '@domain/qualification/types';
import { Participant } from '@domain/participant/types';

type RankingRowProps = {
  item: RankedParticipant;
  participant: Participant | undefined;
};

export const RankingRow: React.FC<RankingRowProps> = ({ item, participant }) => {
  const isTop8 = item.rank <= 8;
  const rankLabel = String(item.rank).padStart(2, '0');
  const numberLabel = participant !== undefined ? `#${participant.number}` : '—';
  const displayName = participant?.name ?? 'Unknown';

  return (
    <Box
      direction="row"
      align="center"
      py={12}
      px={4}
      gap={16}
      style={isTop8 ? styles.row : { ...styles.row, ...styles.dimmed }}
    >
      <Text variant="bodyBold" color={isTop8 ? 'primary' : 'textSecondary'} style={styles.rankCol}>
        {rankLabel}
      </Text>
      <Text variant="body2" color="textSecondary" style={styles.numberCol}>{numberLabel}</Text>
      <Box direction="row" align="center" gap={8} flex={1}>
        <View style={styles.avatar}>
          <Text variant="body2" color="textSecondary">
            {displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text variant="bodyBold" numberOfLines={1}>{displayName}</Text>
      </Box>
      <Text variant="body2" color="textSecondary">{item.averageScore.toFixed(1)}</Text>
    </Box>
  );
};

const styles = StyleSheet.create({
  row: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  dimmed: {
    opacity: 0.4,
  },
  rankCol: {
    width: 32,
  },
  numberCol: {
    width: 32,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.dark.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
