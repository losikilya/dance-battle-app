import { ScrollView, StyleSheet } from 'react-native';
import { Box, Text } from '@components';
import Colors from '@constants/Colors';
import { HEADER_HEIGHT, FOOTER_HEIGHT } from '@constants/Dimensions';
import { getResource } from '@resources';
import { useJudgingClientStore } from '@stores/judgingClient/useJudgingClientStore';
import type { Battle, BattleRound } from '@domain/battle/types';
import {
  formatBattleParticipantNames,
  getBattleParticipantDisplayRows,
} from '@screens/shared/battleDisplay';
import { BattleDuelCard } from './BattleDuelCard';
import { LiveScoreBar } from './LiveScoreBar';

const ROUND_LABELS: Record<BattleRound, string> = {
  custom: getResource('bracket_round_custom'),
  top32: getResource('bracket_round_top32'),
  top16: getResource('bracket_round_top16'),
  top8: getResource('bracket_round_top8'),
  semifinal: getResource('bracket_round_semifinal'),
  final: getResource('bracket_round_final'),
};

const ROUND_DISPLAY_ORDER: BattleRound[] = [
  'final',
  'semifinal',
  'top8',
  'top16',
  'top32',
  'custom',
];

function sortBattlesForDisplay(battles: Battle[]): Battle[] {
  return [...battles].sort((a, b) => {
    const roundDiff =
      ROUND_DISPLAY_ORDER.indexOf(a.round) -
      ROUND_DISPLAY_ORDER.indexOf(b.round);

    if (roundDiff !== 0) {
      return roundDiff;
    }

    return a.slot - b.slot;
  });
}

const getLatestFinishedBattle = (battles: Battle[]): Battle | null => {
  const finishedBattles = battles.filter(
    b => b.status === 'finished' && b.winnerId !== undefined,
  );

  return finishedBattles[finishedBattles.length - 1] ?? null;
};

export const SpectatorLiveScreen: React.FC = () => {
  const syncedState = useJudgingClientStore(s => s.syncedState);
  const assignedRole = useJudgingClientStore(s => s.role);
  const lastError = useJudgingClientStore(s => s.lastError);

  const battles = syncedState?.battles ?? [];
  const activeBattleId = syncedState?.activeBattleId ?? null;
  const activeBattle = battles.find(b => b.id === activeBattleId) ?? null;
  const latestFinishedBattle = getLatestFinishedBattle(battles);
  const displayBattle = activeBattle ?? latestFinishedBattle;
  const displayBattleId = displayBattle?.id ?? null;
  const isLiveBattle = activeBattle !== null;
  const participants = syncedState?.participants ?? [];
  const allVotes = syncedState?.votes ?? [];
  const displayParticipantRows = displayBattle
    ? getBattleParticipantDisplayRows({
        battle: displayBattle,
        participants,
        votes: allVotes,
      })
    : [];
  const maxVotes = Math.max(
    ...displayParticipantRows.map(row => row.voteCount),
    1,
  );
  const winner = participants.find(p => p.id === displayBattle?.winnerId);
  const finalBattle = battles.find(
    b => b.round === 'final' && b.status === 'finished' && b.winnerId !== undefined,
  );
  const champion = participants.find(p => p.id === finalBattle?.winnerId);
  const finishedBattles = battles.filter(
    b => b.status === 'finished' && b.winnerId !== undefined,
  );
  const sortedFinishedBattles = sortBattlesForDisplay(finishedBattles);

  const now = new Date();
  const lastUpdated = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const tzOffset = -now.getTimezoneOffset() / 60;
  const tzLabel = `GMT${tzOffset >= 0 ? '+' : ''}${tzOffset}`;

  const currentRoundBattles = displayBattle
    ? battles.filter(b => b.round === displayBattle.round)
    : [];

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Box direction="row" justify="space-between" align="flex-start" mb={16}>
        <Box gap={2}>
          <Text variant="h2">{syncedState?.event.title ?? '-'}</Text>
          <Text variant="body2" color="textSecondary">{getResource('spectator_battle_mode')}</Text>
        </Box>
        <Box align="flex-end" gap={2}>
          <Text variant="body2" color="textSecondary">
            {getResource('spectator_last_updated')}
          </Text>
          <Text variant="body2" color="textSecondary">
            {lastUpdated} {tzLabel}
          </Text>
        </Box>
      </Box>

      {assignedRole === 'spectator' && (
        <Box style={styles.noticeCard} p={12} mb={16}>
          <Text variant="bodyBold" centered>
            {getResource('connection_waiting_assignment_title')}
          </Text>
          <Text variant="body2" color="textSecondary" centered>
            {getResource('connection_waiting_assignment_body')}
          </Text>
        </Box>
      )}

      {lastError !== null && (
        <Box style={styles.noticeCard} p={12} mb={16}>
          <Text variant="body2" color="textSecondary" centered>
            {getResource('connection_remote_error_prefix')}: {lastError}
          </Text>
        </Box>
      )}

      {champion !== undefined && (
        <Box style={styles.championCard} p={20} gap={4} mb={16}>
          <Text variant="body2" color="textSecondary">
            {getResource('spectator_final_results')}
          </Text>
          <Text variant="h2">
            {getResource('spectator_champion_prefix')} {champion.name}
          </Text>
        </Box>
      )}

      {displayBattle !== null ? (
        <>
          <Box mb={16}>
            <BattleDuelCard
              participants={displayParticipantRows}
              round={displayBattle.round as BattleRound}
              broadcastLabel={
                isLiveBattle
                  ? getResource('spectator_live_broadcast')
                  : getResource('spectator_last_battle_result')
              }
              isLive={isLiveBattle}
            />
          </Box>

          <Box style={styles.scoreCard} p={16} gap={12} mb={16}>
            <Text variant="body2" color="textSecondary">
              {isLiveBattle
                ? getResource('spectator_live_score')
                : getResource('spectator_result_score')}
            </Text>
            {displayParticipantRows.map((row, index) => (
              <LiveScoreBar
                key={row.participantId}
                label={row.name}
                score={row.voteCount}
                fill={row.voteCount / maxVotes}
                color={
                  index % 2 === 0
                    ? Colors.primary.main
                    : Colors.secondary.main
                }
              />
            ))}
            <Box direction="row" gap={12} mt={4}>
              <Box style={styles.metaChip} p={12} gap={2} flex={1}>
                <Text variant="body2" color="textSecondary">
                  {getResource('spectator_intensity')}
                </Text>
                <Text variant="bodyBold">HIGH</Text>
              </Box>
              <Box style={styles.metaChip} p={12} gap={2} flex={1}>
                <Text variant="body2" color="textSecondary">
                  {getResource('spectator_audience')}
                </Text>
                <Text variant="bodyBold">-</Text>
              </Box>
            </Box>
            {!isLiveBattle && winner !== undefined && (
              <Box style={styles.winnerChip} p={12} gap={2}>
                <Text variant="body2" color="textSecondary">
                  {getResource('spectator_winner_label')}
                </Text>
                <Text variant="bodyBold">{winner.name}</Text>
              </Box>
            )}
          </Box>

          {currentRoundBattles.length > 0 && (
            <Box style={styles.bracketCard} p={16} gap={12}>
              <Box direction="row" justify="space-between" align="center">
                <Text variant="bodyBold">
                  {getResource('spectator_bracket_title')}
                </Text>
                <Text variant="body2" color="primary">
                  {ROUND_LABELS[displayBattle.round as BattleRound]}
                </Text>
              </Box>
              {currentRoundBattles.map(b => {
                const rows = getBattleParticipantDisplayRows({
                  battle: b,
                  participants,
                  votes: allVotes,
                });
                const battleWinner = participants.find(p => p.id === b.winnerId);
                const isActive = b.id === displayBattleId;
                return (
                  <Box key={b.id} gap={4}>
                    <Box
                      style={
                        isActive
                          ? { ...styles.bracketSlot, ...styles.bracketSlotActive }
                          : styles.bracketSlot
                      }
                      px={8}
                      py={4}
                    >
                      <Text variant="body2" numberOfLines={1}>
                        {formatBattleParticipantNames(rows)}
                      </Text>
                    </Box>
                    {battleWinner !== undefined && (
                      <Text variant="body2" color="textSecondary">
                        {getResource('spectator_winner_prefix')} {battleWinner.name}
                      </Text>
                    )}
                  </Box>
                );
              })}
            </Box>
          )}

          {finalBattle !== undefined && finishedBattles.length > 0 && (
            <Box style={styles.bracketCard} p={16} gap={10} mt={16}>
              <Text variant="bodyBold">
                {getResource('spectator_results_title')}
              </Text>
              {sortedFinishedBattles.map(b => {
                const battleWinner = participants.find(p => p.id === b.winnerId);
                return (
                  <Box key={b.id} direction="row" justify="space-between" align="center" gap={12}>
                    <Text variant="body2" color="textSecondary">
                      {ROUND_LABELS[b.round]} #{b.slot}
                    </Text>
                    <Text variant="bodyBold" numberOfLines={1} style={styles.resultWinner}>
                      {battleWinner?.name ?? '-'}
                    </Text>
                  </Box>
                );
              })}
            </Box>
          )}
        </>
      ) : (
        <Box style={styles.noBattleCard} p={24} align="center" justify="center">
          <Text variant="body2" color="textSecondary" centered>
            {getResource('spectator_no_battle')}
          </Text>
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
  scoreCard: {
    backgroundColor: Colors.dark.backgroundLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  metaChip: {
    backgroundColor: Colors.dark.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  winnerChip: {
    backgroundColor: Colors.primary.subtle,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary.main,
  },
  championCard: {
    backgroundColor: Colors.primary.subtle,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary.main,
  },
  noticeCard: {
    backgroundColor: Colors.dark.backgroundLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.status.warning,
  },
  bracketCard: {
    backgroundColor: Colors.dark.backgroundLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  bracketSlot: {
    backgroundColor: Colors.dark.background,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  bracketSlotActive: {
    borderColor: Colors.primary.main,
  },
  noBattleCard: {
    backgroundColor: Colors.dark.backgroundLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    minHeight: 120,
  },
  resultWinner: {
    flexShrink: 1,
    textAlign: 'right',
  },
});
