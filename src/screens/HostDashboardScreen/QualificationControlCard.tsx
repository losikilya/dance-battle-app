import { StyleSheet } from 'react-native';
import { Box, Button, QualificationTimerDisplay, Text } from '@components';
import Colors from '@constants/Colors';
import { getResource } from '@resources';
import { useDemoBattleStore } from '@stores/demoBattle/useDemoBattleStore';
import { useSessionStore } from '@stores/session/useSessionStore';
import { getJudgeDisplayName } from '../../shared/lib/getJudgeDisplayName';

export const QualificationControlCard: React.FC = () => {
  const hasHostRole = useSessionStore(s => s.hasRole('host'));
  const selfJudgeId = useSessionStore(s => s.selfJudgeId);
  const participants = useDemoBattleStore(s => s.participants);
  const judges = useDemoBattleStore(s => s.judges);
  const scores = useDemoBattleStore(s => s.scores);
  const currentQualificationParticipantIndex = useDemoBattleStore(
    s => s.currentQualificationParticipantIndex,
  );
  const qualificationTimer = useDemoBattleStore(s => s.qualificationTimer);
  const event = useDemoBattleStore(s => s.event);
  const getCurrentQualificationParticipant = useDemoBattleStore(
    s => s.getCurrentQualificationParticipant,
  );
  const getScoresForCurrentParticipant = useDemoBattleStore(
    s => s.getScoresForCurrentParticipant,
  );
  const canGoToNextQualificationParticipant = useDemoBattleStore(
    s => s.canGoToNextQualificationParticipant,
  );
  const goToNextQualificationParticipant = useDemoBattleStore(
    s => s.goToNextQualificationParticipant,
  );
  const canFinishQualification = useDemoBattleStore(
    s => s.canFinishQualification,
  );
  const finishQualification = useDemoBattleStore(
    s => s.finishQualification,
  );

  const currentParticipant = getCurrentQualificationParticipant();
  const currentParticipantScores =
    scores.length === 0 ? [] : getScoresForCurrentParticipant();

  if (!currentParticipant) {
    return null;
  }

  return (
    <Box style={styles.card} p={20} gap={16} mb={24}>
      <Box gap={4}>
        <Text variant="bodyBold">
          {getResource('host_qualification_title')}
        </Text>
        <Text variant="body2" color="textSecondary">
          {getResource('host_qualification_progress')}{' '}
          {currentQualificationParticipantIndex + 1} / {participants.length}
        </Text>
      </Box>

      <Box style={styles.participantCard} p={16} gap={4}>
        <Text variant="body2" color="primary">
          #{String(currentParticipant.number).padStart(2, '0')}
        </Text>
        <Text variant="h2">{currentParticipant.name}</Text>
        <Text variant="body2" color="textSecondary">
          {[currentParticipant.crew, currentParticipant.city]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      </Box>

      <QualificationTimerDisplay
        timer={qualificationTimer}
        durationSeconds={event.qualificationDurationSeconds}
      />

      <Box gap={8}>
        <Text variant="body2" color="textSecondary">
          {getResource('host_qualification_judge_scores')}
        </Text>
        {judges.map(judge => {
          const score = currentParticipantScores.find(
            item => item.judgeId === judge.id,
          )?.score;

          return (
            <Box
              key={judge.id}
              direction="row"
              justify="space-between"
              style={styles.scoreRow}
              px={12}
              py={10}
            >
              <Text variant="body">
                {getJudgeDisplayName({
                  judgeId: judge.id,
                  judgeName: judge.name,
                  isHost: hasHostRole,
                  selfJudgeId,
                })}
              </Text>
              <Text
                variant="bodyBold"
                color={score === undefined ? 'textSecondary' : 'primary'}
              >
                {score === undefined
                  ? getResource('host_qualification_not_scored')
                  : `${score}/10`}
              </Text>
            </Box>
          );
        })}
      </Box>

      <Box gap={12}>
        <Button
          disabled={!canGoToNextQualificationParticipant()}
          onPress={() => {
            void goToNextQualificationParticipant();
          }}
        >
          {getResource('host_qualification_next')}
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          disabled={!canFinishQualification()}
          onPress={() => {
            void finishQualification();
          }}
        >
          {getResource('host_qualification_finish')}
        </Button>
      </Box>
    </Box>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.dark.backgroundLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary.main,
  },
  participantCard: {
    backgroundColor: Colors.dark.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  scoreRow: {
    backgroundColor: Colors.dark.background,
    borderRadius: 8,
  },
});
