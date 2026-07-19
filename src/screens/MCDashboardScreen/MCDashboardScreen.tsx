import { useMemo } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Box, Text, Button, QualificationTimerDisplay } from "@components";
import Colors from "@constants/Colors";
import { HEADER_HEIGHT, FOOTER_HEIGHT } from "@constants/Dimensions";
import { getResource } from "@resources";
import { useJudgingClientStore } from "@stores/judgingClient/useJudgingClientStore";
import { calculateRanking } from "@domain/qualification/calculateRanking";
import { getQualificationParticipants } from "@domain/sync/stateSelectors";
import type { RankedParticipant } from "@domain/qualification/types";

const STATUS_LABELS: Record<string, string> = {
  draft: "DRAFT",
  qualification: "QUALIFICATION",
  qualification_finished: "RANKING",
  battle: "BATTLES",
  finished: "FINISHED",
};

export const MCDashboardScreen: React.FC = () => {
  const router = useRouter();
  const syncedState = useJudgingClientStore((s) => s.syncedState);
  const pauseQualificationTimer = useJudgingClientStore(
    (s) => s.pauseQualificationTimer,
  );
  const resumeQualificationTimer = useJudgingClientStore(
    (s) => s.resumeQualificationTimer,
  );
  const restartQualificationTimer = useJudgingClientStore(
    (s) => s.restartQualificationTimer,
  );
  const advanceQualificationParticipant = useJudgingClientStore(
    (s) => s.advanceQualificationParticipant,
  );
  const finishQualification = useJudgingClientStore(
    (s) => s.finishQualification,
  );

  const allParticipants = syncedState?.participants ?? [];
  const participants = syncedState
    ? getQualificationParticipants(syncedState)
    : [];
  const scores = syncedState?.scores ?? [];
  const ranking = useMemo(
    () => calculateRanking({ participants, scores }),
    [participants, scores],
  );

  const idx = syncedState?.currentQualificationParticipantIndex ?? 0;
  const currentParticipant = participants[idx] ?? null;
  const nextParticipant = participants[idx + 1] ?? null;
  const total = participants.length;
  const progress = total > 0 ? (idx + 1) / total : 0;
  const eventStatus = syncedState?.event.status ?? "draft";
  const qualificationTimer = syncedState?.qualificationTimer ?? null;
  const event = syncedState?.event ?? null;
  const top8 = ranking.slice(0, 8);
  const isManualMode =
    event?.battleConfiguration?.qualificationAdvanceMode === "manual";
  const canFinishQualification =
    eventStatus === "qualification" &&
    participants.length > 0 &&
    (syncedState?.judges.length ?? 0) > 0 &&
    judgesHaveSubmittedAllScores({
      judgesCount: syncedState?.judges.length ?? 0,
      participantsCount: participants.length,
      scoresCount: scores.length,
    });

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Box direction="row" align="center" gap={8} mb={4}>
        <Box style={styles.greenDot} />
        <Text variant="body2" style={styles.liveText}>
          {getResource("mc_live_event")}
        </Text>
      </Box>
      <Box mb={4}>
        <Text variant="body2" color="textSecondary">
          {getResource("mc_stage_prefix")}{" "}
          {STATUS_LABELS[eventStatus] ?? eventStatus}
        </Text>
      </Box>

      <Box direction="row" justify="space-between" align="center" mb={4}>
        <Text variant="body2" color="textSecondary">
          {getResource("mc_progress_label")}
        </Text>
        <Text variant="body2" color="textSecondary">
          {idx + 1} / {total}
        </Text>
      </Box>
      <Box style={styles.progressTrack} mb={24}>
        <Box
          style={{
            ...styles.progressFill,
            width: `${progress * 100}%` as `${number}%`,
          }}
        />
      </Box>

      {currentParticipant !== null && (
        <Box style={styles.heroCard} mb={16}>
          <Box style={styles.photoPlaceholder} align="center" justify="center">
            <Text variant="body2" color="textSecondary">
              {getResource("mc_photo_placeholder")}
            </Text>
          </Box>
          <Box p={16} gap={8}>
            <Box style={styles.nowDancingChip} px={12} py={4}>
              <Text variant="body2" style={styles.nowDancingText}>
                {getResource("mc_now_dancing")}
              </Text>
            </Box>
            <Text variant="h1">
              #{String(currentParticipant.number).padStart(2, "0")}{" "}
              {currentParticipant.name}
            </Text>
            <Text variant="body2" color="primary">
              {syncedState?.event.battleConfiguration?.categoryTitle ?? "—"} /{" "}
              {currentParticipant.city}
            </Text>

            <Box direction="row" gap={1} mt={8}>
              <Box style={styles.statBox} align="center" gap={4} flex={1}>
                <Text variant="body2" color="textSecondary">
                  {getResource("mc_remaining")}
                </Text>
                <Text variant="bodyBold">
                  {qualificationTimer?.status.toUpperCase() ?? "READY"}
                </Text>
              </Box>
            </Box>
          </Box>
        </Box>
      )}

      {eventStatus === "qualification" && qualificationTimer && event && (
        <Box style={styles.timerCard} p={16} gap={12} mb={24}>
          <QualificationTimerDisplay
            timer={qualificationTimer}
            durationSeconds={
              event.battleConfiguration?.qualificationDurationSeconds ?? 60
            }
          />
          <Box direction="row" gap={8}>
            <Box flex={1}>
              <Button
                variant="outlined"
                color="secondary"
                onPress={
                  qualificationTimer.status === "paused"
                    ? resumeQualificationTimer
                    : pauseQualificationTimer
                }
                disabled={
                  qualificationTimer.status !== "running" &&
                  qualificationTimer.status !== "paused"
                }
              >
                {qualificationTimer.status === "paused" ? "RESUME" : "PAUSE"}
              </Button>
            </Box>
            <Box flex={1}>
              <Button
                variant="outlined"
                color="secondary"
                onPress={restartQualificationTimer}
              >
                RESTART
              </Button>
            </Box>
          </Box>
          {isManualMode && (
            <Button
              variant="outlined"
              color="secondary"
              onPress={advanceQualificationParticipant}
              disabled={idx >= participants.length - 1}
            >
              NEXT PARTICIPANT
            </Button>
          )}
          {canFinishQualification && (
            <Button
              variant="contained"
              color="primary"
              onPress={finishQualification}
            >
              {getResource("host_qualification_finish")}
            </Button>
          )}
        </Box>
      )}

      {nextParticipant !== null && (
        <Box style={styles.nextUpCard} p={16} gap={12} mb={24}>
          <Box direction="row" align="center" gap={12}>
            <Box style={styles.avatarCircle} align="center" justify="center">
              <Text variant="bodyBold" color="primary">
                {nextParticipant.name.charAt(0).toUpperCase()}
              </Text>
            </Box>
            <Box gap={2}>
              <Text variant="body2" color="textSecondary">
                {getResource("mc_next_up")}
              </Text>
              <Text variant="bodyBold">
                #{String(nextParticipant.number).padStart(2, "0")}{" "}
                {nextParticipant.name}
              </Text>
            </Box>
          </Box>
        </Box>
      )}

      <Box direction="row" justify="space-between" align="center" mb={12}>
        <Text variant="bodyBold">{getResource("mc_top8_title")}</Text>
      </Box>

      {top8.map((item: RankedParticipant) => {
        const participant = allParticipants.find(
          (p) => p.id === item.participantId,
        );
        return (
          <Box
            key={item.participantId}
            style={styles.rankRow}
            px={12}
            py={10}
            mb={4}
            direction="row"
            align="center"
            gap={12}
          >
            <Text variant="bodyBold" color="primary" style={styles.rankNumber}>
              {String(item.rank).padStart(2, "0")}
            </Text>
            <Box flex={1} gap={2}>
              <Text variant="bodyBold">{participant?.name ?? "—"}</Text>
              <Text variant="body2" color="textSecondary">
                {getResource("mc_tech_art_placeholder")}
              </Text>
            </Box>
            <Text variant="bodyBold">{item.averageScore.toFixed(1)}</Text>
          </Box>
        );
      })}
    </ScrollView>
  );
};

function judgesHaveSubmittedAllScores(params: {
  judgesCount: number;
  participantsCount: number;
  scoresCount: number;
}): boolean {
  return params.scoresCount >= params.participantsCount * params.judgesCount;
}

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
  liveText: {
    color: Colors.status.online,
  },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.dark.backgroundLight,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: 4,
    backgroundColor: Colors.primary.main,
    borderRadius: 2,
  },
  heroCard: {
    backgroundColor: Colors.dark.backgroundLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    overflow: "hidden",
  },
  photoPlaceholder: {
    width: "100%",
    height: 220,
    backgroundColor: Colors.dark.background,
  },
  nowDancingChip: {
    backgroundColor: Colors.primary.main,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  nowDancingText: {
    color: Colors.dark.background,
    fontWeight: "700",
  },
  statBox: {
    paddingVertical: 8,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border.subtle,
    marginVertical: 8,
  },
  nextUpCard: {
    backgroundColor: Colors.dark.backgroundLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  timerCard: {
    backgroundColor: Colors.dark.backgroundLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.dark.background,
    borderWidth: 1,
    borderColor: Colors.primary.main,
  },
  rankRow: {
    backgroundColor: Colors.dark.backgroundLight,
    borderRadius: 8,
  },
  rankNumber: {
    width: 28,
  },
});
