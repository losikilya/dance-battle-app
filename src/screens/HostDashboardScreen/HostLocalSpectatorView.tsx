import { ScrollView, StyleSheet } from 'react-native';
import { Box, Text } from '@components';
import Colors from '@constants/Colors';
import { FOOTER_HEIGHT } from '@constants/Dimensions';
import { getResource } from '@resources';
import { useDemoBattleStore } from '@stores/demoBattle/useDemoBattleStore';
import { BattleDuelCard } from '@screens/SpectatorLiveScreen/BattleDuelCard';
import { LiveScoreBar } from '@screens/SpectatorLiveScreen/LiveScoreBar';
import type { Battle, BattleRound } from '@domain/battle/types';
import {
  formatBattleParticipantNames,
  getBattleParticipantDisplayRows,
} from '@screens/shared/battleDisplay';

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
    battle => battle.status === 'finished' && battle.winnerId !== undefined,
  );

  return finishedBattles[finishedBattles.length - 1] ?? null;
};

export const HostLocalSpectatorView: React.FC = () => {
  const event = useDemoBattleStore(state => state.event);
  const participants = useDemoBattleStore(state => state.participants);
  const battles = useDemoBattleStore(state => state.battles);
  const votes = useDemoBattleStore(state => state.votes);
  const activeBattleId = useDemoBattleStore(state => state.activeBattleId);
  const getChampionId = useDemoBattleStore(state => state.getChampionId);

  const activeBattle =
    battles.find(battle => battle.id === activeBattleId) ?? null;
  const latestFinishedBattle = getLatestFinishedBattle(battles);
  const displayBattle = activeBattle ?? latestFinishedBattle;
  const isLiveBattle = activeBattle !== null;
  const displayParticipantRows = displayBattle
    ? getBattleParticipantDisplayRows({
        battle: displayBattle,
        participants,
        votes,
      })
    : [];
  const maxVotes = Math.max(
    ...displayParticipantRows.map(row => row.voteCount),
    1,
  );
  const winner = participants.find(item => item.id === displayBattle?.winnerId);
  const championId = getChampionId();
  const champion = participants.find(item => item.id === championId);
  const finalBattleFinished = battles.some(
    battle => battle.round === 'final' && battle.status === 'finished' && battle.winnerId !== undefined,
  );
  const finishedBattles = battles.filter(
    battle => battle.status === 'finished' && battle.winnerId !== undefined,
  );
  const sortedBattles = sortBattlesForDisplay(battles);
  const sortedFinishedBattles = sortBattlesForDisplay(finishedBattles);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Box gap={4} mb={24}>
        <Text variant="body2" color="primary">LOCAL SPECTATOR VIEW</Text>
        <Text variant="h1">{event.title}</Text>
        <Text variant="body2" color="textSecondary">
          {event.battleConfiguration?.categoryTitle ?? '-'}
        </Text>
      </Box>

      {champion && (
        <Box style={styles.championCard} p={24} gap={4} mb={20}>
          <Text variant="body2" color="textSecondary">
            {getResource('spectator_final_results')}
          </Text>
          <Text variant="h1">{champion.name}</Text>
        </Box>
      )}

      {displayBattle ? (
        <>
          <Box mb={16}>
            <BattleDuelCard
              participants={displayParticipantRows}
              round={displayBattle.round}
              broadcastLabel={
                isLiveBattle
                  ? getResource('spectator_live_broadcast')
                  : getResource('spectator_last_battle_result')
              }
              isLive={isLiveBattle}
            />
          </Box>
          <Box style={styles.card} p={20} gap={12} mb={20}>
            <Text variant="bodyBold">
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
            {!isLiveBattle && winner !== undefined && (
              <Box style={styles.winnerChip} p={12} gap={2}>
                <Text variant="body2" color="textSecondary">
                  {getResource('spectator_winner_label')}
                </Text>
                <Text variant="bodyBold">{winner.name}</Text>
              </Box>
            )}
          </Box>
        </>
      ) : (
        <Box style={styles.card} p={24} mb={20}>
          <Text variant="body2" color="textSecondary" centered>
            {getResource('spectator_no_battle')}
          </Text>
        </Box>
      )}

      <Box style={styles.card} p={20} gap={10}>
        <Text variant="bodyBold">{getResource('spectator_bracket_title')}</Text>
        {battles.length === 0 ? (
          <Text variant="body2" color="textSecondary">
            {getResource('bracket_placeholder')}
          </Text>
        ) : (
          sortedBattles.map(battle => {
            const rows = getBattleParticipantDisplayRows({
              battle,
              participants,
              votes,
            });

            return (
              <Box key={battle.id} gap={2}>
                <Text variant="body">{formatBattleParticipantNames(rows)}</Text>
                <Text variant="body2" color="textSecondary">
                  {battle.round.toUpperCase()} - {battle.status.toUpperCase()}
                </Text>
                {battle.winnerId !== undefined && (
                  <Text variant="body2" color="textSecondary">
                    {getResource('spectator_winner_prefix')}{' '}
                    {participants.find(p => p.id === battle.winnerId)?.name ?? '-'}
                  </Text>
                )}
              </Box>
            );
          })
        )}
      </Box>

      {finalBattleFinished && finishedBattles.length > 0 && (
        <Box style={styles.card} p={20} gap={10} mt={20}>
          <Text variant="bodyBold">{getResource('spectator_results_title')}</Text>
          {sortedFinishedBattles.map(battle => (
            <Box key={battle.id} direction="row" justify="space-between" align="center" gap={12}>
              <Text variant="body2" color="textSecondary">
                {ROUND_LABELS[battle.round]} #{battle.slot}
              </Text>
              <Text variant="bodyBold" numberOfLines={1} style={styles.resultWinner}>
                {participants.find(p => p.id === battle.winnerId)?.name ?? '-'}
              </Text>
            </Box>
          ))}
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
    paddingHorizontal: 24,
    paddingBottom: FOOTER_HEIGHT + 24,
  },
  card: {
    backgroundColor: Colors.dark.backgroundLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  championCard: {
    backgroundColor: Colors.primary.subtle,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary.main,
  },
  winnerChip: {
    backgroundColor: Colors.primary.subtle,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary.main,
  },
  resultWinner: {
    flexShrink: 1,
    textAlign: 'right',
  },
});
