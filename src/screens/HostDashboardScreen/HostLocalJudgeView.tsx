import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Box, Button, Text } from '@components';
import Colors from '@constants/Colors';
import { FOOTER_HEIGHT } from '@constants/Dimensions';
import { getResource } from '@resources';
import { useDemoBattleStore } from '@stores/demoBattle/useDemoBattleStore';
import { useSessionStore } from '@stores/session/useSessionStore';
import { ScoreNumpad } from '@screens/JudgeQualificationScreen/ScoreNumpad';
import { DancerVoteCard } from '@screens/JudgeBattleVotingScreen/DancerVoteCard';
import { getJudgeDisplayName } from '../../shared/lib/getJudgeDisplayName';

function getInitialLocalQualificationParticipantIndex(params: {
  currentIndex: number;
  participants: ReturnType<typeof useDemoBattleStore.getState>['participants'];
  scores: ReturnType<typeof useDemoBattleStore.getState>['scores'];
  judgeId: string | null;
}): number | null {
  const { currentIndex, participants, scores, judgeId } = params;

  if (participants.length === 0) {
    return null;
  }

  if (!judgeId) {
    return Math.min(currentIndex, participants.length - 1);
  }

  for (let index = 0; index <= currentIndex; index += 1) {
    const participant = participants[index];

    if (
      participant &&
      !scores.some(
        score =>
          score.participantId === participant.id && score.judgeId === judgeId,
      )
    ) {
      return index;
    }
  }

  return Math.min(currentIndex, participants.length - 1);
}

export const HostLocalJudgeView: React.FC = () => {
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [pendingVote, setPendingVote] = useState<string | null>(null);
  const [
    localQualificationParticipantIndex,
    setLocalQualificationParticipantIndex,
  ] = useState<number | null>(null);
  const [qualificationViewMode, setQualificationViewMode] = useState<
    'score' | 'list'
  >('score');

  const hasJudgeRole = useSessionStore(state => state.hasRole('judge'));
  const selfJudgeId = useSessionStore(state => state.selfJudgeId);
  const isHost = useSessionStore(state => state.roles.includes('host'));
  const event = useDemoBattleStore(state => state.event);
  const participants = useDemoBattleStore(state => state.participants);
  const judges = useDemoBattleStore(state => state.judges);
  const scores = useDemoBattleStore(state => state.scores);
  const votes = useDemoBattleStore(state => state.votes);
  const battles = useDemoBattleStore(state => state.battles);
  const activeBattleId = useDemoBattleStore(state => state.activeBattleId);
  const currentIndex = useDemoBattleStore(
    state => state.currentQualificationParticipantIndex,
  );
  const submitQualificationScore = useDemoBattleStore(
    state => state.submitQualificationScore,
  );
  const submitBattleVote = useDemoBattleStore(
    state => state.submitBattleVote,
  );

  const currentParticipant =
    localQualificationParticipantIndex !== null
      ? participants[localQualificationParticipantIndex] ?? null
      : null;
  const activeBattle =
    battles.find(battle => battle.id === activeBattleId) ?? null;
  const participantA = participants.find(
    participant => participant.id === activeBattle?.participantAId,
  );
  const participantB = participants.find(
    participant => participant.id === activeBattle?.participantBId,
  );
  const selfJudge = judges.find(judge => judge.id === selfJudgeId);
  const displayRole = isHost ? 'host' : null;
  const existingScore =
    scores.find(
      score =>
        score.participantId === currentParticipant?.id &&
        score.judgeId === selfJudgeId,
    )?.score ?? null;
  const existingVote =
    votes.find(
      vote =>
        vote.battleId === activeBattleId && vote.judgeId === selfJudgeId,
    ) ?? null;
  const canActAsJudge = hasJudgeRole && selfJudgeId !== null;
  const isVotingOpen = activeBattle?.status === 'voting';
  const canGoToPreviousLocalParticipant =
    localQualificationParticipantIndex !== null &&
    localQualificationParticipantIndex > 0;
  const canGoToNextLocalParticipant =
    localQualificationParticipantIndex !== null &&
    localQualificationParticipantIndex < participants.length - 1;
  const participantRows = participants.map((participant, index) => {
    const judgeScore =
      scores.find(
        score =>
          score.participantId === participant.id &&
          score.judgeId === selfJudgeId,
      )?.score ?? null;

    return {
      participant,
      index,
      judgeScore,
      isCurrent: index === currentIndex,
      isSelected: index === localQualificationParticipantIndex,
      canOpen: index <= currentIndex,
    };
  });

  useEffect(() => {
    setLocalQualificationParticipantIndex(previousIndex => {
      const initialIndex = getInitialLocalQualificationParticipantIndex({
        currentIndex,
        participants,
        scores,
        judgeId: selfJudgeId,
      });

      if (
        previousIndex === null ||
        initialIndex === null ||
        previousIndex >= participants.length
      ) {
        return initialIndex;
      }

      return previousIndex;
    });
  }, [currentIndex, participants, scores, selfJudgeId]);

  useEffect(() => {
    setSelectedScore(null);
  }, [currentParticipant?.id]);

  useEffect(() => {
    setPendingVote(null);
  }, [activeBattleId]);

  const handleSubmitScore = () => {
    if (
      !canActAsJudge ||
      !selfJudgeId ||
      !currentParticipant ||
      selectedScore === null ||
      existingScore !== null
    ) {
      return;
    }

    void submitQualificationScore({
      participantId: currentParticipant.id,
      judgeId: selfJudgeId,
      score: selectedScore,
    });
    setSelectedScore(null);
  };

  const handleSubmitVote = () => {
    if (
      !canActAsJudge ||
      !selfJudgeId ||
      !isVotingOpen ||
      !activeBattleId ||
      !pendingVote ||
      existingVote
    ) {
      return;
    }

    void submitBattleVote({
      battleId: activeBattleId,
      judgeId: selfJudgeId,
      winnerId: pendingVote,
    });
    setPendingVote(null);
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Box gap={4} mb={20}>
        <Text variant="body2" color="primary">LOCAL JUDGE VIEW</Text>
        <Text variant="h1">
          {selfJudge
            ? getJudgeDisplayName({
                judgeId: selfJudge.id,
                judgeName: selfJudge.name,
                role: displayRole,
                selfJudgeId,
              })
            : 'Host'}
        </Text>
      </Box>

      {!hasJudgeRole && (
        <Box style={styles.notice} p={16} mb={20}>
          <Text variant="body2" color="textSecondary">
            Judge self-role is not enabled. This view is read-only.
          </Text>
        </Box>
      )}

      {hasJudgeRole && selfJudgeId === null && (
        <Box style={styles.notice} p={16} mb={20}>
          <Text variant="body2" color="textSecondary">
            No self Judge identity is assigned. Scoring and voting are disabled.
          </Text>
        </Box>
      )}

      {event.status === 'qualification' && currentParticipant ? (
        <>
          <Box style={styles.viewToggle} direction="row" mb={8}>
            <TouchableOpacity
              style={[
                styles.viewToggleOption,
                qualificationViewMode === 'score' && styles.viewToggleOptionActive,
              ]}
              onPress={() => setQualificationViewMode('score')}
            >
              <Text
                variant="button"
                color={qualificationViewMode === 'score' ? 'dark' : 'textSecondary'}
              >
                {getResource('judge_score_view')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.viewToggleOption,
                qualificationViewMode === 'list' && styles.viewToggleOptionActive,
              ]}
              onPress={() => setQualificationViewMode('list')}
            >
              <Text
                variant="button"
                color={qualificationViewMode === 'list' ? 'dark' : 'textSecondary'}
              >
                {getResource('judge_list_view')}
              </Text>
            </TouchableOpacity>
          </Box>

          <Box style={styles.card} p={20} gap={16}>
            {qualificationViewMode === 'score' ? (
              <>
              <Box gap={4}>
                <Box direction="row" align="center" gap={8}>
                  <Text variant="body2" color="primary">QUALIFICATION</Text>
                  {localQualificationParticipantIndex === currentIndex && (
                    <Box style={styles.currentChip} px={8} py={3}>
                      <Text variant="caption" color="primary">
                        {getResource('judge_current_participant')}
                      </Text>
                    </Box>
                  )}
                </Box>
                <Text variant="h1">
                  #{String(currentParticipant.number).padStart(2, '0')}{' '}
                  {currentParticipant.name}
                </Text>
              </Box>

              <ScoreNumpad
                selected={existingScore ?? selectedScore}
                onSelect={setSelectedScore}
                locked={!canActAsJudge || existingScore !== null}
              />

              <Button
                disabled={
                  !canActAsJudge ||
                  selectedScore === null ||
                  existingScore !== null
                }
                onPress={handleSubmitScore}
              >
                {existingScore === null
                  ? 'SUBMIT'
                  : `${getResource('judge_score_submitted')}: ${existingScore}/10`}
              </Button>

              <Box direction="row" gap={8}>
                <Box flex={1}>
                  <Button
                    variant="outlined"
                    color="secondary"
                    disabled={!canGoToPreviousLocalParticipant}
                    onPress={() => {
                      setLocalQualificationParticipantIndex(previousIndex => {
                        if (previousIndex === null) {
                          return null;
                        }

                        return Math.max(previousIndex - 1, 0);
                      });
                    }}
                  >
                    {getResource('judge_previous_participant')}
                  </Button>
                </Box>

                <Box flex={1}>
                  <Button
                    variant="outlined"
                    color="secondary"
                    disabled={!canGoToNextLocalParticipant}
                    onPress={() => {
                      setLocalQualificationParticipantIndex(previousIndex => {
                        if (previousIndex === null) {
                          return null;
                        }

                        return Math.min(previousIndex + 1, participants.length - 1);
                      });
                    }}
                  >
                    {getResource('judge_next_participant')}
                  </Button>
                </Box>
              </Box>
              </>
            ) : (
              <Box gap={8}>
                {participantRows.map((item) => (
                  <TouchableOpacity
                    key={item.participant.id}
                    disabled={!item.canOpen}
                    onPress={() => {
                      setLocalQualificationParticipantIndex(item.index);
                      setQualificationViewMode('score');
                    }}
                    style={[
                      styles.participantRow,
                      item.isSelected && styles.selectedParticipantRow,
                      !item.canOpen && styles.disabledParticipantRow,
                    ]}
                  >
                    <Box direction="row" align="center" gap={10} fullWidth>
                      <Text
                        variant="bodyBold"
                        color={item.canOpen ? 'primary' : 'textSecondary'}
                        style={styles.participantNumber}
                      >
                        #{String(item.participant.number).padStart(2, '0')}
                      </Text>
                      <Box flex={1} gap={4}>
                        <Text
                          variant="bodyBold"
                          color={item.canOpen ? 'textPrimary' : 'textSecondary'}
                          numberOfLines={1}
                        >
                          {item.participant.name}
                        </Text>
                        {item.isCurrent && (
                          <Box style={styles.currentChipList} px={8} py={3}>
                            <Text variant="caption" color="primary">
                              {getResource('judge_current_participant')}
                            </Text>
                          </Box>
                        )}
                        {(item.participant.crew !== undefined ||
                          item.participant.city !== undefined) && (
                          <Text variant="body2" color="textSecondary" numberOfLines={1}>
                            {[item.participant.crew, item.participant.city]
                              .filter(Boolean)
                              .join(' · ')}
                          </Text>
                        )}
                      </Box>
                      <Text
                        variant="bodyBold"
                        color={item.judgeScore === null ? 'textSecondary' : 'primary'}
                        style={styles.scoreValue}
                      >
                        {item.judgeScore === null
                          ? getResource('host_qualification_not_scored')
                          : `${item.judgeScore}/10`}
                      </Text>
                    </Box>
                  </TouchableOpacity>
                ))}
              </Box>
            )}
          </Box>
        </>
      ) : event.status === 'battle' &&
        activeBattle &&
        participantA &&
        participantB ? (
        <Box gap={16}>
          <DancerVoteCard
            participant={participantA}
            label="DANCER A"
            accentColor={Colors.primary.main}
            isSelected={pendingVote === participantA.id}
            onPress={() => setPendingVote(participantA.id)}
            disabled={!canActAsJudge || !isVotingOpen || existingVote !== null}
            categoryTitle={event.battleConfiguration?.categoryTitle ?? '—'}
          />
          <DancerVoteCard
            participant={participantB}
            label="DANCER B"
            accentColor={Colors.secondary.main}
            isSelected={pendingVote === participantB.id}
            onPress={() => setPendingVote(participantB.id)}
            disabled={!canActAsJudge || !isVotingOpen || existingVote !== null}
            categoryTitle={event.battleConfiguration?.categoryTitle ?? '—'}
          />

          {activeBattle.status === 'active' && (
            <Box style={styles.notice} p={16}>
              <Text variant="body2" color="textSecondary" centered>
                Waiting for Host Control to open voting.
              </Text>
            </Box>
          )}

          {existingVote ? (
            <Box style={styles.notice} p={16}>
              <Text variant="bodyBold" color="primary" centered>
                LOCAL VOTE SUBMITTED
              </Text>
            </Box>
          ) : (
            <Button
              disabled={
                !canActAsJudge || !isVotingOpen || pendingVote === null
              }
              onPress={handleSubmitVote}
            >
              CONFIRM LOCAL VOTE
            </Button>
          )}
        </Box>
      ) : (
        <Box style={styles.notice} p={24}>
          <Text variant="body2" color="textSecondary" centered>
            Waiting for qualification or an active battle.
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
    paddingHorizontal: 24,
    paddingBottom: FOOTER_HEIGHT + 24,
  },
  card: {
    backgroundColor: Colors.dark.backgroundLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary.main,
  },
  notice: {
    backgroundColor: Colors.dark.backgroundLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  viewToggle: {
    backgroundColor: Colors.dark.backgroundLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    padding: 4,
  },
  viewToggleOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 10,
  },
  viewToggleOptionActive: {
    backgroundColor: Colors.primary.main,
  },
  participantRow: {
    backgroundColor: Colors.dark.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  selectedParticipantRow: {
    borderColor: Colors.primary.main,
  },
  disabledParticipantRow: {
    opacity: 0.45,
  },
  participantNumber: {
    width: 44,
  },
  currentChip: {
    backgroundColor: Colors.primary.subtleAlt,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.primary.main,
    alignSelf: 'flex-start',
  },
  currentChipList: {
    backgroundColor: Colors.primary.subtleAlt,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.primary.main,
    alignSelf: 'flex-start',
  },
  scoreValue: {
    minWidth: 86,
    textAlign: 'right',
  },
});
