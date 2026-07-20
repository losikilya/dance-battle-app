import { useEffect, useMemo, useState } from "react";
import { StyleSheet } from "react-native";

import { Box, Button, Text } from "@components";
import Colors from "@constants/Colors";
import { getResource } from "@resources";
import { useDemoBattleStore } from "@stores/demoBattle/useDemoBattleStore";
import { useSessionStore } from "@stores/session/useSessionStore";
import { ScoreNumpad } from "@screens/JudgeQualificationScreen/ScoreNumpad";
import { getQualificationParticipants } from "@domain/sync/stateSelectors";

export function BattleJudgeScoreCard(): React.JSX.Element | null {
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const hasJudgeRole = useSessionStore((state) => state.hasRole("judge"));
  const selfJudgeId = useSessionStore((state) => state.selfJudgeId);
  const event = useDemoBattleStore((state) => state.event);
  const participants = useDemoBattleStore((state) => state.participants);
  const scores = useDemoBattleStore((state) => state.scores);
  const currentQualificationParticipantIndex = useDemoBattleStore(
    (state) => state.currentQualificationParticipantIndex,
  );
  const submitQualificationScore = useDemoBattleStore(
    (state) => state.submitQualificationScore,
  );

  const qualificationParticipants = useMemo(
    () =>
      getQualificationParticipants({
        event,
        participants,
      }),
    [event, participants],
  );
  const currentParticipant =
    qualificationParticipants[currentQualificationParticipantIndex] ?? null;
  const existingScore =
    scores.find(
      (score) =>
        score.participantId === currentParticipant?.id &&
        score.judgeId === selfJudgeId,
    )?.score ?? null;
  const canSubmitScore =
    hasJudgeRole &&
    selfJudgeId !== null &&
    currentParticipant !== null &&
    selectedScore !== null &&
    existingScore === null;

  useEffect(() => {
    setSelectedScore(null);
  }, [currentParticipant?.id]);

  if (!currentParticipant) {
    return null;
  }

  const handleSubmitScore = (): void => {
    if (!canSubmitScore || !selfJudgeId || selectedScore === null) {
      return;
    }

    void submitQualificationScore({
      participantId: currentParticipant.id,
      judgeId: selfJudgeId,
      score: selectedScore,
    });
    setSelectedScore(null);
  };

  return (
    <Box style={styles.card} p={20} gap={16} mb={24}>
      <Box gap={4}>
        <Text variant="bodyBold">{getResource("judge_numpad_label")}</Text>
        <Text variant="body2" color="textSecondary">
          #{String(currentParticipant.number).padStart(2, "0")}{" "}
          {currentParticipant.name}
        </Text>
      </Box>

      {selfJudgeId === null ? (
        <Box style={styles.notice} p={16}>
          <Text variant="body2" color="textSecondary" centered>
            {getResource("judge_no_self_identity")}
          </Text>
        </Box>
      ) : (
        <>
          <ScoreNumpad
            selected={existingScore ?? selectedScore}
            onSelect={setSelectedScore}
            locked={existingScore !== null}
          />
          <Button disabled={!canSubmitScore} onPress={handleSubmitScore}>
            {existingScore === null
              ? getResource("judge_submit_score")
              : `${getResource("judge_score_submitted")}: ${existingScore}/10`}
          </Button>
        </>
      )}
    </Box>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.dark.backgroundLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary.main,
  },
  notice: {
    backgroundColor: Colors.dark.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
});
