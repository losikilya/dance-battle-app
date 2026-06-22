import { ScrollView, StyleSheet } from 'react-native';
import { Box, Text } from '@components';
import Colors from '@constants/Colors';
import { HEADER_HEIGHT, FOOTER_HEIGHT } from '@constants/Dimensions';
import { getResource } from '@resources';
import { useJudgingClientStore } from '@stores/judgingClient/useJudgingClientStore';
import type { BattleRound } from '@domain/battle/types';
import { BattleDuelCard } from './BattleDuelCard';
import { LiveScoreBar } from './LiveScoreBar';

export const SpectatorLiveScreen: React.FC = () => {
  const syncedState = useJudgingClientStore(s => s.syncedState);

  const battles = syncedState?.battles ?? [];
  const activeBattleId = syncedState?.activeBattleId ?? null;
  const activeBattle = battles.find(b => b.id === activeBattleId) ?? null;
  const participants = syncedState?.participants ?? [];

  const participantA = participants.find(p => p.id === activeBattle?.participantAId);
  const participantB = participants.find(p => p.id === activeBattle?.participantBId);

  const allVotes = syncedState?.votes ?? [];
  const battleVotes = allVotes.filter(v => v.battleId === activeBattleId);
  const votesA = battleVotes.filter(v => v.winnerId === activeBattle?.participantAId).length;
  const votesB = battleVotes.filter(v => v.winnerId === activeBattle?.participantBId).length;
  const maxVotes = Math.max(votesA, votesB, 1);

  const now = new Date();
  const lastUpdated = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const tzOffset = -now.getTimezoneOffset() / 60;
  const tzLabel = `GMT${tzOffset >= 0 ? '+' : ''}${tzOffset}`;

  const currentRoundBattles = activeBattle
    ? battles.filter(b => b.round === activeBattle.round)
    : [];

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Box direction="row" justify="space-between" align="flex-start" mb={16}>
        <Box gap={2}>
          <Text variant="h2">{syncedState?.event.title ?? '—'}</Text>
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

      {activeBattle !== null ? (
        <>
          <Box mb={16}>
            <BattleDuelCard
              participantA={participantA}
              participantB={participantB}
              round={activeBattle.round as BattleRound}
            />
          </Box>

          <Box style={styles.scoreCard} p={16} gap={12} mb={16}>
            <Text variant="body2" color="textSecondary">
              {getResource('spectator_live_score')}
            </Text>
            <LiveScoreBar
              label={participantA?.name ?? 'A'}
              score={votesA}
              fill={votesA / maxVotes}
              color={Colors.primary.main}
            />
            <LiveScoreBar
              label={participantB?.name ?? 'B'}
              score={votesB}
              fill={votesB / maxVotes}
              color={Colors.secondary.main}
            />
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
                <Text variant="bodyBold">—</Text>
              </Box>
            </Box>
          </Box>

          {currentRoundBattles.length > 0 && (
            <Box style={styles.bracketCard} p={16} gap={12}>
              <Box direction="row" justify="space-between" align="center">
                <Text variant="bodyBold">
                  {getResource('spectator_bracket_title')}
                </Text>
                <Text variant="body2" color="primary">
                  {activeBattle.round === 'top8' ? getResource('spectator_round_quarter')
                    : activeBattle.round === 'semifinal' ? getResource('spectator_round_semi')
                    : getResource('spectator_round_final')}
                </Text>
              </Box>
              {currentRoundBattles.map(b => {
                const nameA = participants.find(p => p.id === b.participantAId)?.name ?? '—';
                const nameB = participants.find(p => p.id === b.participantBId)?.name ?? '—';
                const isActive = b.id === activeBattleId;
                return (
                  <Box key={b.id} direction="row" align="center" gap={8}>
                    <Box
                      style={isActive ? { ...styles.bracketSlot, ...styles.bracketSlotActive } : styles.bracketSlot}
                      px={8}
                      py={4}
                      flex={1}
                    >
                      <Text variant="body2" numberOfLines={1}>{nameA}</Text>
                    </Box>
                    <Text variant="body2" color="textSecondary">vs</Text>
                    <Box style={styles.bracketSlot} px={8} py={4} flex={1}>
                      <Text variant="body2" numberOfLines={1}>{nameB}</Text>
                    </Box>
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
});
