import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Box, Text, Button, QualificationTimerDisplay } from '@components';
import Colors from '@constants/Colors';
import { HEADER_HEIGHT, FOOTER_HEIGHT } from '@constants/Dimensions';
import { getResource } from '@resources';
import { useJudgingClientStore } from '@stores/judgingClient/useJudgingClientStore';
import { ScoreNumpad } from './ScoreNumpad';
import { CriteriaBar } from './CriteriaBar';
import type { BattleAppState } from '@domain/sync/appState';
import { getQualificationParticipants } from '@domain/sync/stateSelectors';

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

function getPendingParticipantIndexForJudge(
  syncedState: BattleAppState | null,
  judgeId: string | null,
): number | null {
  if (!syncedState || !judgeId) {
    return null;
  }

  const participants = getQualificationParticipants(syncedState);

  if (participants.length === 0) {
    return null;
  }

  for (
    let index = 0;
    index <= syncedState.currentQualificationParticipantIndex;
    index += 1
  ) {
    const participant = participants[index];

    if (
      participant &&
      !syncedState.scores.some(
        score =>
          score.participantId === participant.id && score.judgeId === judgeId,
      )
    ) {
      return index;
    }
  }

  return Math.min(
    syncedState.currentQualificationParticipantIndex,
    participants.length - 1,
  );
}

export const JudgeQualificationScreen: React.FC = () => {
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [
    localQualificationParticipantIndex,
    setLocalQualificationParticipantIndex,
  ] = useState<number | null>(null);
  const [qualificationViewMode, setQualificationViewMode] = useState<
    'score' | 'list'
  >('score');

  const status = useJudgingClientStore(s => s.status);
  const syncedState = useJudgingClientStore(s => s.syncedState);
  const sendScore = useJudgingClientStore(s => s.sendScore);
  const judgeId = useJudgingClientStore(s => s.assignedJudgeId);

  const participants = syncedState
    ? getQualificationParticipants(syncedState)
    : [];
  const scores = syncedState?.scores ?? [];
  const currentIndex = syncedState?.currentQualificationParticipantIndex ?? 0;
  const hostCurrentParticipant = participants[currentIndex] ?? null;
  const currentParticipant =
    localQualificationParticipantIndex !== null
      ? participants[localQualificationParticipantIndex] ?? null
      : null;

  const existingScore = scores.find(
    s => s.participantId === currentParticipant?.id && s.judgeId === judgeId,
  )?.score ?? null;

  const alreadySubmitted = existingScore !== null;
  const displayScore = alreadySubmitted ? existingScore : selectedScore;
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
          score.participantId === participant.id && score.judgeId === judgeId,
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
      const initialIndex = getPendingParticipantIndexForJudge(
        syncedState,
        judgeId,
      );

      if (
        previousIndex === null ||
        initialIndex === null ||
        previousIndex >= participants.length
      ) {
        return initialIndex;
      }

      return previousIndex;
    });
  }, [judgeId, participants.length, syncedState]);

  useEffect(() => {
    setSelectedScore(null);
  }, [currentParticipant?.id]);

  const handleSubmit = () => {
    if (!currentParticipant || selectedScore === null || alreadySubmitted || !judgeId) return;
    sendScore({ participantId: currentParticipant.id, score: selectedScore });
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
          {syncedState?.event.status === 'qualification' && (
            <Box mb={16}>
              <QualificationTimerDisplay
                timer={syncedState.qualificationTimer}
                durationSeconds={syncedState.event.battleConfiguration?.qualificationDurationSeconds ?? 60}
              />
            </Box>
          )}

          {hostCurrentParticipant &&
            hostCurrentParticipant.id !== currentParticipant.id && (
              <Box style={styles.notice} p={12} mb={16}>
                <Text variant="body2" color="textSecondary" centered>
                  Сейчас выступает: {hostCurrentParticipant.name}
                </Text>
              </Box>
            )}

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

          {qualificationViewMode === 'score' ? (
            <>
              <Box style={styles.participantCard} mb={24} gap={12}>
                <Box direction="row" align="center" gap={8}>
                  <Box px={10} py={4} style={styles.numberBadge}>
                    <Text variant="bodyBold" color="primary">
                      #{String(currentParticipant.number).padStart(2, '0')}
                    </Text>
                  </Box>
                  {localQualificationParticipantIndex === currentIndex && (
                    <Box style={styles.currentChip} px={8} py={3}>
                      <Text variant="caption" color="primary">
                        {getResource('judge_current_participant')}
                      </Text>
                    </Box>
                  )}
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
                {alreadySubmitted
                  ? `${getResource('judge_score_submitted')}: ${existingScore}/10`
                  : getResource('judge_submit_score')}
              </Button>

              <Box direction="row" gap={8} mt={12}>
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
            <Box style={styles.participantCard} mb={24} gap={8}>
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
  notice: {
    backgroundColor: Colors.dark.backgroundLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.status.warning,
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
