import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Box, Text, Button } from '@components';
import Colors from '@constants/Colors';
import { HEADER_HEIGHT, FOOTER_HEIGHT } from '@constants/Dimensions';
import { getResource } from '@resources';
import { useJudgingClientStore } from '@stores/judgingClient/useJudgingClientStore';
import { useSessionStore } from '@stores/session/useSessionStore';
import { DancerVoteCard } from './DancerVoteCard';

const ROUND_LABELS: Record<string, string> = {
  top8: getResource('judge_round_top8'),
  semifinal: getResource('judge_round_semifinal'),
  final: getResource('judge_round_final'),
};

export const JudgeBattleVotingScreen: React.FC = () => {
  const [pendingVote, setPendingVote] = useState<string | null>(null);

  const syncedState = useJudgingClientStore(s => s.syncedState);
  const submitBattleVote = useJudgingClientStore(s => s.submitBattleVote);
  const judgeId = useJudgingClientStore(s => s.assignedJudgeId);
  const assignedJudgeName = useJudgingClientStore(s => s.assignedJudgeName);
  const judgeName = useSessionStore(s => s.judgeName);

  const battles = syncedState?.battles ?? [];
  const activeBattleId = syncedState?.activeBattleId ?? null;
  const activeBattle = battles.find(b => b.id === activeBattleId) ?? null;

  const participants = syncedState?.participants ?? [];
  const participantA = activeBattle ? participants.find(p => p.id === activeBattle.participantAId) ?? null : null;
  const participantB = activeBattle ? participants.find(p => p.id === activeBattle.participantBId) ?? null : null;

  const existingVote = syncedState?.votes.find(
    v => v.battleId === activeBattleId && v.judgeId === judgeId,
  ) ?? null;

  const isVotingOpen = activeBattle?.status === 'voting' || activeBattle?.status === 'active';
  const categoryTitle = syncedState?.event.categoryTitle ?? '—';
  const round = activeBattle?.round;
  const slot = activeBattle?.slot;

  const handleConfirm = () => {
    if (!activeBattleId || !pendingVote || !judgeId) return;
    submitBattleVote({ battleId: activeBattleId, winnerId: pendingVote });
    setPendingVote(null);
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Box direction="row" justify="space-between" align="center" mb={16}>
        <Text variant="body2" color="textSecondary">{getResource('judge_mode_label')}</Text>
        {(assignedJudgeName ?? judgeName) !== null && (
          <Text variant="body2" color="primary">
            {assignedJudgeName ?? judgeName}
          </Text>
        )}
      </Box>

      {activeBattle !== null && (
        <Box direction="row" align="center" gap={8} mb={24}>
          <View style={styles.greenDot} />
          <Text variant="body2" color="textSecondary">{getResource('judge_live_event')}</Text>
          {round !== undefined && (
            <Text variant="body2" color="textSecondary">· {ROUND_LABELS[round] ?? round}</Text>
          )}
          {slot !== undefined && (
            <Text variant="body2" color="textSecondary">· {getResource('judge_heat_prefix')} {slot}</Text>
          )}
        </Box>
      )}

      {activeBattle !== null && participantA !== null && participantB !== null ? (
        <>
          <Box mb={12}>
            <DancerVoteCard
              participant={participantA}
              label={getResource('judge_dancer_a')}
              accentColor={Colors.primary.main}
              isSelected={pendingVote === participantA.id}
              onPress={() => setPendingVote(participantA.id)}
              disabled={!isVotingOpen || existingVote !== null}
              categoryTitle={categoryTitle}
            />
          </Box>

          <Box mb={24}>
            <DancerVoteCard
              participant={participantB}
              label={getResource('judge_dancer_b')}
              accentColor={Colors.secondary.dark}
              isSelected={pendingVote === participantB.id}
              onPress={() => setPendingVote(participantB.id)}
              disabled={!isVotingOpen || existingVote !== null}
              categoryTitle={categoryTitle}
            />
          </Box>

          {existingVote !== null ? (
            <Box style={styles.submittedCard} p={16} align="center" gap={4}>
              <Text variant="bodyBold" color="primary">{getResource('judge_vote_submitted')}</Text>
              <Text variant="body2" color="textSecondary">
                {getResource('judge_voted_for_prefix')} {existingVote.winnerId === participantA.id ? participantA.name : participantB.name}
              </Text>
            </Box>
          ) : (
            <>
              <Box direction="row" gap={12} mb={12}>
                <Box flex={1}>
                  <Button
                    variant={pendingVote === participantA.id ? 'contained' : 'outlined'}
                    color={pendingVote === participantA.id ? 'primary' : 'secondary'}
                    onPress={() => setPendingVote(participantA.id)}
                    disabled={!isVotingOpen}
                  >
                    {getResource('judge_vote_a')}
                  </Button>
                </Box>
                <Box flex={1}>
                  <Button
                    variant={pendingVote === participantB.id ? 'contained' : 'outlined'}
                    color={pendingVote === participantB.id ? 'primary' : 'secondary'}
                    onPress={() => setPendingVote(participantB.id)}
                    disabled={!isVotingOpen}
                  >
                    {getResource('judge_vote_b')}
                  </Button>
                </Box>
              </Box>

              {pendingVote !== null && (
                <Button
                  onPress={handleConfirm}
                  disabled={!isVotingOpen || !judgeId}
                >
                  {getResource('judge_vote_confirm')}
                </Button>
              )}

              {!isVotingOpen && (
                <Box style={styles.waitingCard} p={24} align="center" gap={12} mt={8}>
                  <Text variant="bodyBold" centered>{getResource('judge_waiting_title')}</Text>
                  <Text variant="body2" color="textSecondary" centered>
                    {getResource('judge_waiting_body')}
                  </Text>
                  <View style={styles.progressTrack}>
                    <View style={styles.progressFill} />
                  </View>
                </Box>
              )}
            </>
          )}
        </>
      ) : (
        <Box align="center" justify="center" flex={1} gap={8} mt={48}>
          <Text variant="bodyBold" centered>{getResource('judge_no_active_battle')}</Text>
          <Text variant="body2" color="textSecondary" centered>{getResource('judge_no_battle_body')}</Text>
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
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.status.online,
  },
  submittedCard: {
    backgroundColor: Colors.primary.subtle,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary.main,
  },
  waitingCard: {
    backgroundColor: Colors.dark.backgroundLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  progressTrack: {
    width: '100%',
    height: 3,
    backgroundColor: Colors.dark.background,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    width: '60%',
    backgroundColor: Colors.primary.main,
    borderRadius: 2,
  },
});
