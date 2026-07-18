import { ScrollView, StyleSheet } from 'react-native';
import { Box, Text, Button } from '@components';
import Colors from '@constants/Colors';
import { HEADER_HEIGHT, FOOTER_HEIGHT } from '@constants/Dimensions';
import { getResource } from '@resources';
import { useBattleState } from '@stores/battle/useBattleState';
import { useDemoBattleStore } from '@stores/demoBattle/useDemoBattleStore';
import { calculateRanking } from '@domain/qualification/calculateRanking';
import { RankingRow } from './RankingRow';

export const RankingsScreen: React.FC = () => {
  const { event, isHost, isReady, participants, scores } = useBattleState();
  const generateTop8 = useDemoBattleStore(s => s.generateTop8);
  const canGenerateTop8 = useDemoBattleStore(s => s.canGenerateTop8);

  const ranking = calculateRanking({ participants, scores });

  const avgScore = ranking.length > 0
    ? ranking.reduce((sum, r) => sum + r.averageScore, 0) / ranking.length
    : 0;

  if (!isReady) {
    return (
      <Box fullHeight color={Colors.dark.background} align="center" justify="center" px={24}>
        <Text variant="body2" color="textSecondary" centered>
          Waiting for Host ranking...
        </Text>
      </Box>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Box direction="row" align="center" gap={8} mb={12}>
        <Box style={styles.dot} />
        <Text variant="body2" color="primary">{getResource('ranking_live_label')}</Text>
      </Box>

      <Box mb={8}>
        <Text variant="h1">{getResource('ranking_title')}</Text>
      </Box>

      <Box mb={16}>
        <Text variant="body2" color="textSecondary">
          {getResource('ranking_description_prefix')} {event?.categoryTitle ?? '—'}{getResource('ranking_description_suffix')}
        </Text>
      </Box>

      <Box direction="row" gap={12} mb={24}>
        <Box style={styles.metaChip} px={12} py={8}>
          <Text variant="body2" color="textSecondary">
            PARTICIPANTS: {participants.length} / {participants.length}
          </Text>
        </Box>
        <Box style={styles.metaChip} px={12} py={8}>
          <Text variant="body2" color="primary">{getResource('ranking_stat_final')}</Text>
        </Box>
      </Box>

      <Box direction="row" px={4} mb={8} gap={16}>
        <Text variant="body2" color="textSecondary" style={styles.rankCol}>{getResource('ranking_header_rank')}</Text>
        <Text variant="body2" color="textSecondary" style={styles.numberCol}>{getResource('ranking_header_number')}</Text>
        <Text variant="body2" color="textSecondary" style={styles.nameCol}>{getResource('ranking_header_name')}</Text>
        <Text variant="body2" color="textSecondary">AVG</Text>
      </Box>

      <Box mb={24}>
        {ranking.map(item => {
          const participant = participants.find(p => p.id === item.participantId);
          return (
            <RankingRow key={item.participantId} item={item} participant={participant} />
          );
        })}
      </Box>

      <Box gap={16} mb={24}>
        <Box style={styles.statCard} p={20} align="center">
          <Box mb={4}>
            <Text variant="body2" color="textSecondary">{getResource('ranking_stat_avg_score')}</Text>
          </Box>
          <Text variant="h1">{avgScore.toFixed(1)}</Text>
        </Box>
        <Box style={styles.statCard} p={16} direction="row" justify="space-between">
          <Text variant="body2" color="textSecondary">{getResource('ranking_stat_efficiency')}</Text>
          <Text variant="body2">{getResource('ranking_stat_efficiency_value')}</Text>
        </Box>
      </Box>

      {isHost && (
        <Box style={styles.ctaCard} p={20} gap={16}>
          <Text variant="bodyBold" color="dark">{getResource('ranking_cta_label')}</Text>
          <Button
            color="secondaryDark"
            onPress={generateTop8}
            disabled={!canGenerateTop8()}
          >
            {getResource('ranking_cta_button')}
          </Button>
        </Box>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  content: {
    paddingTop: HEADER_HEIGHT + 24,
    paddingBottom: FOOTER_HEIGHT + 24,
    paddingHorizontal: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.status.online,
  },
  metaChip: {
    backgroundColor: Colors.dark.backgroundLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  rankCol: {
    width: 32,
  },
  numberCol: {
    width: 32,
  },
  nameCol: {
    flex: 1,
  },
  statCard: {
    backgroundColor: Colors.dark.backgroundLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  ctaCard: {
    backgroundColor: Colors.primary.main,
    borderRadius: 12,
  },
});
