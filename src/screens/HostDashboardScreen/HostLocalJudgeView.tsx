import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Box, Button, Text } from '@components';
import Colors from '@constants/Colors';
import { FOOTER_HEIGHT } from '@constants/Dimensions';
import { useDemoBattleStore } from '@stores/demoBattle/useDemoBattleStore';
import { useSessionStore } from '@stores/session/useSessionStore';
import { ScoreNumpad } from '@screens/JudgeQualificationScreen/ScoreNumpad';
import { DancerVoteCard } from '@screens/JudgeBattleVotingScreen/DancerVoteCard';
import { getJudgeDisplayName } from '../../shared/lib/getJudgeDisplayName';

export const HostLocalJudgeView: React.FC = () => {
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [pendingVote, setPendingVote] = useState<string | null>(null);

  const hasJudgeRole = useSessionStore(state => state.hasRole('judge'));
  const selfJudgeId = useSessionStore(state => state.selfJudgeId);
  const role = useSessionStore(state => state.role);
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
  const canGoToNextQualificationParticipant = useDemoBattleStore(
    state => state.canGoToNextQualificationParticipant,
  );
  const goToNextQualificationParticipant = useDemoBattleStore(
    state => state.goToNextQualificationParticipant,
  );
  const canFinishQualification = useDemoBattleStore(
    state => state.canFinishQualification,
  );
  const finishQualification = useDemoBattleStore(
    state => state.finishQualification,
  );
  const submitBattleVote = useDemoBattleStore(
    state => state.submitBattleVote,
  );

  const currentParticipant = participants[currentIndex] ?? null;
  const activeBattle =
    battles.find(battle => battle.id === activeBattleId) ?? null;
  const participantA = participants.find(
    participant => participant.id === activeBattle?.participantAId,
  );
  const participantB = participants.find(
    participant => participant.id === activeBattle?.participantBId,
  );
  const selfJudge = judges.find(judge => judge.id === selfJudgeId);
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
                role,
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
        <Box style={styles.card} p={20} gap={16}>
          <Box gap={4}>
            <Text variant="body2" color="primary">QUALIFICATION</Text>
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
              ? 'SUBMIT LOCAL SCORE'
              : `SCORE SUBMITTED: ${existingScore}/10`}
          </Button>

          <Button
            variant="outlined"
            color="secondary"
            disabled={!canGoToNextQualificationParticipant()}
            onPress={() => {
              void goToNextQualificationParticipant();
            }}
          >
            NEXT PARTICIPANT
          </Button>

          <Button
            variant="outlined"
            color="secondary"
            disabled={!canFinishQualification()}
            onPress={() => {
              void finishQualification();
            }}
          >
            FINISH QUALIFICATION
          </Button>
        </Box>
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
            categoryTitle={event.categoryTitle}
          />
          <DancerVoteCard
            participant={participantB}
            label="DANCER B"
            accentColor={Colors.secondary.main}
            isSelected={pendingVote === participantB.id}
            onPress={() => setPendingVote(participantB.id)}
            disabled={!canActAsJudge || !isVotingOpen || existingVote !== null}
            categoryTitle={event.categoryTitle}
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
});
