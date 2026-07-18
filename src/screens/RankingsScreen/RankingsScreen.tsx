import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Box, Text, Button } from '@components';
import Colors from '@constants/Colors';
import { HEADER_HEIGHT, FOOTER_HEIGHT } from '@constants/Dimensions';
import { getResource } from '@resources';
import { useBattleState } from '@stores/battle/useBattleState';
import { useDemoBattleStore } from '@stores/demoBattle/useDemoBattleStore';
import { useJudgingClientStore } from '@stores/judgingClient/useJudgingClientStore';
import { useSessionStore } from '@stores/session/useSessionStore';
import { calculateRanking } from '@domain/qualification/calculateRanking';
import { getActiveBattleConfigurationId, isInBattleConfiguration } from '@domain/sync/stateSelectors';
import { RankingRow } from './RankingRow';

export const RankingsScreen: React.FC = () => {
  const { state, isHost } = useBattleState();
  const generateBracket = useDemoBattleStore(s => s.generateBracket);
  const canGenerateBracket = useDemoBattleStore(s => s.canGenerateBracket);
  const generateRemoteBracket = useJudgingClientStore(s => s.generateBracket);
  const roles = useSessionStore(s => s.roles);
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]);

  const activeBattleConfigurationId = state ? getActiveBattleConfigurationId(state.event) : null;
  const participants = (state?.participants ?? []).filter(
    (p) => isInBattleConfiguration(activeBattleConfigurationId, p),
  );
  const scores = state?.scores ?? [];
  const ranking = calculateRanking({ participants, scores });
  const rankingParticipantIds = ranking.map((item) => item.participantId);

  useEffect(() => {
    setSelectedParticipantIds((current) => {
      return current.filter((participantId) =>
        rankingParticipantIds.includes(participantId),
      );
    });
  }, [rankingParticipantIds.join('|')]);

  const avgScore = ranking.length > 0
    ? ranking.reduce((sum, r) => sum + r.averageScore, 0) / ranking.length
    : 0;
  const canManageBracket = isHost || roles.includes('mc');
  const canSubmitBracket =
    isHost
      ? canGenerateBracket() && selectedParticipantIds.length >= 2
      : state?.event.status === 'qualification_finished' &&
        state.battles.length === 0 &&
        selectedParticipantIds.length >= 2;

  const handleGenerateBracket = (): void => {
    if (isHost) {
      void generateBracket(selectedParticipantIds);
      return;
    }

    generateRemoteBracket(selectedParticipantIds);
  };

  const selectBracketCutoff = (participantId: string): void => {
    const cutoffIndex = rankingParticipantIds.indexOf(participantId);

    if (cutoffIndex < 0) {
      return;
    }

    setSelectedParticipantIds(rankingParticipantIds.slice(0, cutoffIndex + 1));
  };

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
          {getResource('ranking_description_prefix')} {state?.event.battleConfiguration?.categoryTitle ?? '—'}{getResource('ranking_description_suffix')}
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
          const isSelected = selectedParticipantIds.includes(item.participantId);
          const selectedIndex = rankingParticipantIds.indexOf(item.participantId);
          const isFirstSelected = isSelected && selectedIndex === 0;
          const isLastSelected = isSelected &&
            selectedIndex === selectedParticipantIds.length - 1;
          return (
            <Box key={item.participantId} direction="row" align="center" gap={8}>
              {canManageBracket && (
                <Box
                  style={StyleSheet.flatten([
                    styles.selectionRail,
                    isSelected && styles.selectionRailActive,
                    isFirstSelected && styles.selectionRailFirst,
                    isLastSelected && styles.selectionRailLast,
                  ])}
                />
              )}
              <Box flex={1}>
                <RankingRow item={item} participant={participant} />
              </Box>
              {canManageBracket && (
                <TouchableOpacity
                  style={[styles.selectButton, isSelected && styles.selectButtonActive]}
                  onPress={() => selectBracketCutoff(item.participantId)}
                  accessibilityRole="button"
                >
                  <Text variant="body2" color={isSelected ? 'dark' : 'textSecondary'}>
                    {isSelected ? getResource('ranking_selected') : getResource('ranking_select')}
                  </Text>
                </TouchableOpacity>
              )}
            </Box>
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

      {canManageBracket && (
        <Box style={styles.ctaCard} p={20} gap={16}>
          <Text variant="bodyBold" color="dark">{getResource('ranking_cta_label')}</Text>
          <Text variant="body2" color="dark">
            {getResource('ranking_selected_count_prefix')} {selectedParticipantIds.length}
          </Text>
          <Button
            color="secondaryDark"
            onPress={handleGenerateBracket}
            disabled={!canSubmitBracket}
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
  selectButton: {
    width: 74,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    backgroundColor: Colors.dark.backgroundLight,
  },
  selectButtonActive: {
    borderColor: Colors.primary.main,
    backgroundColor: Colors.primary.main,
  },
  selectionRail: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: 0,
    backgroundColor: 'transparent',
  },
  selectionRailActive: {
    backgroundColor: Colors.primary.main,
  },
  selectionRailFirst: {
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  selectionRailLast: {
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
});
