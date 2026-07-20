import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";

import { Box, Button, Text } from "@components";
import Colors from "@constants/Colors";
import { getResource } from "@resources";
import type { Battle } from "@domain/battle/types";
import type { Participant } from "@domain/participant/types";
import { useDemoBattleStore } from "@stores/demoBattle/useDemoBattleStore";
import { useSessionStore } from "@stores/session/useSessionStore";
import { DancerVoteCard } from "@screens/JudgeBattleVotingScreen/DancerVoteCard";

type HostBattleVoteWidgetProps = {
  battle: Battle;
  participants: Participant[];
  categoryTitle: string;
};

export function HostBattleVoteWidget({
  battle,
  participants,
  categoryTitle,
}: HostBattleVoteWidgetProps): React.JSX.Element | null {
  const [pendingVote, setPendingVote] = useState<string | null>(null);
  const selfJudgeId = useSessionStore((state) => state.selfJudgeId);
  const votes = useDemoBattleStore((state) => state.votes);
  const submitBattleVote = useDemoBattleStore((state) => state.submitBattleVote);

  const participantIds = battle.participantIds ?? [
    battle.participantAId,
    battle.participantBId,
  ];
  const battleParticipants = participantIds
    .map(
      (participantId) =>
        participants.find((participant) => participant.id === participantId) ??
        null,
    )
    .filter(
      (participant): participant is Participant => participant !== null,
    );
  const existingVote =
    votes.find(
      (vote) => vote.battleId === battle.id && vote.judgeId === selfJudgeId,
    ) ?? null;
  const isVotingOpen = battle.status === "voting";

  useEffect(() => {
    setPendingVote(null);
  }, [battle.id]);

  if (battleParticipants.length < 2) {
    return null;
  }

  const handleConfirmVote = (): void => {
    if (!isVotingOpen || !selfJudgeId || !pendingVote || existingVote) {
      return;
    }

    void submitBattleVote({
      battleId: battle.id,
      judgeId: selfJudgeId,
      winnerId: pendingVote,
    });
    setPendingVote(null);
  };

  return (
    <Box style={styles.card} p={16} gap={12} mb={24}>
      <Box direction="row" justify="space-between" align="center" gap={12}>
        <Text variant="bodyBold">{getResource("judge_mode_label")}</Text>
        <Text variant="body2" color="textSecondary">
          {getResource("bracket_battle_prefix")}
          {battle.slot}
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
          {battleParticipants.map((participant, index) => (
            <DancerVoteCard
              key={participant.id}
              participant={participant}
              label={`${getResource("judge_dancer_label")} ${index + 1}`}
              accentColor={
                index % 2 === 0 ? Colors.primary.main : Colors.secondary.dark
              }
              isSelected={pendingVote === participant.id}
              onPress={() => setPendingVote(participant.id)}
              disabled={!isVotingOpen || existingVote !== null}
              categoryTitle={categoryTitle}
            />
          ))}

          {existingVote ? (
            <Box style={styles.notice} p={16}>
              <Text variant="bodyBold" color="primary" centered>
                {getResource("judge_vote_submitted")}
              </Text>
            </Box>
          ) : (
            <Button
              disabled={!isVotingOpen || pendingVote === null}
              onPress={handleConfirmVote}
            >
              {getResource("judge_vote_confirm")}
            </Button>
          )}
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
