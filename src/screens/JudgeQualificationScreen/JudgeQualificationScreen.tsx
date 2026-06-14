import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Box, Text, Button } from '@components';
import Colors from '@constants/Colors';
import { HEADER_HEIGHT, FOOTER_HEIGHT } from '@constants/Dimensions';
import { getResource } from '@resources';
import { useJudgingClientStore } from '@stores/judgingClient/useJudgingClientStore';
import { ScoreNumpad } from './ScoreNumpad';
import { CriteriaBar } from './CriteriaBar';

const CRITERIA = [
  { key: 'technique', label: () => getResource('judge_criteria_technique'), value: 0.75 },
  { key: 'musicality', label: () => getResource('judge_criteria_musicality'), value: 0.6 },
  { key: 'execution', label: () => getResource('judge_criteria_execution'), value: 0.8 },
  { key: 'difficulty', label: () => getResource('judge_criteria_difficulty'), value: 0.55 },
] as const;

const STATUS_COLORS: Record<string, string> = {
  connected: Colors.status.online,
  reconnecting: Colors.status.warning,
  disconnected: Colors.text.error,
  error: Colors.text.error,
  connecting: Colors.text.secondary,
};

const STATUS_LABEL_KEYS: Record<string, string> = {
  connected: 'judge_badge_connected',
  reconnecting: 'judge_badge_reconnecting',
  disconnected: 'judge_badge_disconnected',
  error: 'judge_badge_disconnected',
  connecting: 'judge_badge_disconnected',
};

export const JudgeQualificationScreen: React.FC = () => {
  const [selectedScore, setSelectedScore] = useState<number | null>(null);

  const status = useJudgingClientStore(s => s.status);
  const syncedState = useJudgingClientStore(s => s.syncedState);
  const submitCurrentQualificationScore = useJudgingClientStore(
    s => s.submitCurrentQualificationScore,
  );
  const judgeId = useJudgingClientStore(s => s.assignedJudgeId);

  const participants = syncedState?.participants ?? [];
  const currentIndex = syncedState?.currentQualificationParticipantIndex ?? 0;
  const currentParticipant = participants[currentIndex] ?? null;

  const existingScore = syncedState?.scores.find(
    s => s.participantId === currentParticipant?.id && s.judgeId === judgeId,
  )?.score ?? null;

  const alreadySubmitted = existingScore !== null;
  const displayScore = alreadySubmitted ? existingScore : selectedScore;

  const handleSubmit = () => {
    if (!currentParticipant || selectedScore === null || alreadySubmitted || !judgeId) return;
    submitCurrentQualificationScore(selectedScore);
    setSelectedScore(null);
  };

  const statusColor = STATUS_COLORS[status] ?? Colors.text.secondary;
  const statusKey = STATUS_LABEL_KEYS[status] ?? 'judge_badge_disconnected';

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Box direction="row" justify="flex-end" mb={16}>
        <Box
          direction="row"
          align="center"
          gap={6}
          px={10}
          py={6}
          style={styles.connectionBadge}
        >
          <View style={[styles.dot, { backgroundColor: statusColor }]} />
          <Text variant="body2" style={{ color: statusColor }}>
            {getResource(statusKey as Parameters<typeof getResource>[0])}
          </Text>
        </Box>
      </Box>

      {currentParticipant !== null ? (
        <>
          <Box style={styles.participantCard} mb={24} gap={12}>
            <Box px={10} py={4} style={styles.numberBadge}>
              <Text variant="bodyBold" color="primary">
                #{String(currentParticipant.number).padStart(2, '0')}
              </Text>
            </Box>
            <View style={styles.photoPlaceholder} />
            <Text variant="body2" color="primary">{getResource('judge_qualification_round')}</Text>
            <Text variant="h1">{currentParticipant.name}</Text>
            {(currentParticipant.crew !== undefined || currentParticipant.city !== undefined) && (
              <Text variant="body2" color="textSecondary">
                {[currentParticipant.crew, currentParticipant.city].filter(Boolean).join(' · ')}
              </Text>
            )}
          </Box>

          <Box mb={24} gap={12}>
            <Box direction="row" justify="space-between">
              <Text variant="body2" color="textSecondary">{getResource('judge_numpad_label')}</Text>
              <Text variant="body2" color="textSecondary">{getResource('judge_numpad_scale')}</Text>
            </Box>
            <ScoreNumpad
              selected={displayScore}
              onSelect={setSelectedScore}
              locked={alreadySubmitted}
            />
          </Box>

          <Box gap={10} mb={24}>
            {CRITERIA.map(c => (
              <CriteriaBar key={c.key} label={c.label()} value={c.value} />
            ))}
          </Box>

          <Button
            onPress={handleSubmit}
            disabled={selectedScore === null || alreadySubmitted || !judgeId}
          >
            {getResource('judge_submit_score')}
          </Button>
        </>
      ) : (
        <Box align="center" justify="center" flex={1} gap={8} mt={48}>
          <Text variant="body2" color="textSecondary" centered>{getResource('judge_waiting_participant')}</Text>
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
  connectionBadge: {
    backgroundColor: Colors.dark.backgroundLight,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  participantCard: {
    backgroundColor: Colors.dark.backgroundLight,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  numberBadge: {
    backgroundColor: Colors.primary.subtleAlt,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  photoPlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: Colors.dark.background,
    borderRadius: 12,
  },
});
