import { useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

import { Box, Button, Text } from "@components";
import Colors from "@constants/Colors";
import { HEADER_HEIGHT, FOOTER_HEIGHT } from "@constants/Dimensions";
import { getResource } from "@resources";
import type { EventStatus } from "@domain/event/types";
import type { Battle, BattleRound } from "@domain/battle/types";
import { isInBattleConfiguration } from "@domain/sync/stateSelectors";
import { useDemoBattleStore } from "@stores/demoBattle/useDemoBattleStore";
import { useJudgingServerStore } from "@stores/judgingServer/useJudgingServerStore";
import { useSessionStore } from "@stores/session/useSessionStore";
import {
  HostActionsMenu,
  type HostMenuAction,
} from "@screens/HostDashboardScreen/HostActionsMenu";
import { QualificationControlCard } from "@screens/HostDashboardScreen/QualificationControlCard";
import {
  RosterListModal,
  type RosterListItem,
} from "@screens/HostDashboardScreen/RosterListModal";
import { StatCard } from "@screens/HostDashboardScreen/StatCard";
import { BattleCard } from "@screens/BracketScreen/BattleCard";
import { BattleJudgeScoreCard } from "./BattleJudgeScoreCard";

const statusLabels: Record<EventStatus, string> = {
  draft: getResource("dashboard_status_draft"),
  qualification: getResource("dashboard_status_qualification"),
  qualification_finished: getResource("dashboard_status_ranking"),
  battle: getResource("dashboard_status_battles"),
  finished: getResource("dashboard_status_finished"),
};

const roundOrder: BattleRound[] = [
  "final",
  "semifinal",
  "top8",
  "top16",
  "top32",
  "custom",
];

const roundLabels: Record<BattleRound, string> = {
  custom: getResource("bracket_round_custom"),
  top32: getResource("bracket_round_top32"),
  top16: getResource("bracket_round_top16"),
  top8: getResource("bracket_round_top8"),
  semifinal: getResource("bracket_round_semifinal"),
  final: getResource("bracket_round_final"),
};

function canGenerateNextRoundForBattles(battles: Battle[]): boolean {
  const playableRoundOrder: BattleRound[] = [
    "custom",
    "top32",
    "top16",
    "top8",
    "semifinal",
  ];
  const currentRound = [...playableRoundOrder]
    .reverse()
    .find((round) => battles.some((battle) => battle.round === round));

  if (!currentRound) {
    return false;
  }

  const currentRoundIndex = playableRoundOrder.indexOf(currentRound);
  const currentBattles = battles.filter(
    (battle) => battle.round === currentRound,
  );
  const nextRoundExists =
    battles.some(
      (battle) =>
        battle.round !== currentRound &&
        playableRoundOrder.indexOf(battle.round) > currentRoundIndex,
    ) || battles.some((battle) => battle.round === "final");

  return (
    !nextRoundExists &&
    currentBattles.length > 0 &&
    currentBattles.every((battle) => battle.status === "finished")
  );
}

type BattleRosterList = "participants" | "judges" | "mc";

export function BattleDashboardScreen(): React.JSX.Element {
  const router = useRouter();
  const [openRosterList, setOpenRosterList] = useState<BattleRosterList | null>(
    null,
  );
  const params = useLocalSearchParams<{ battleConfigurationId?: string }>();
  const isHost = useSessionStore((state) => state.roles.includes("host"));
  const sessionRoles = useSessionStore((state) => state.roles);
  const hasJudgeRole = sessionRoles.includes("judge");
  const hasMcRole = sessionRoles.includes("mc");
  const hasTimerCompanionRole = isHost || hasMcRole;
  const setRoles = useSessionStore((state) => state.setRoles);
  const setSelfJudgeId = useSessionStore((state) => state.setSelfJudgeId);
  const event = useDemoBattleStore((state) => state.event);
  const judges = useDemoBattleStore((state) => state.judges);
  const participants = useDemoBattleStore((state) => state.participants);
  const assignBattleJudge = useDemoBattleStore(
    (state) => state.assignBattleJudge,
  );
  const selectBattleConfiguration = useDemoBattleStore(
    (state) => state.selectBattleConfiguration,
  );
  const startQualification = useDemoBattleStore(
    (state) => state.startQualification,
  );
  const fillRandomQualificationScores = useDemoBattleStore(
    (state) => state.fillRandomQualificationScores,
  );
  const battles = useDemoBattleStore((state) => state.battles);
  const generateNextRound = useDemoBattleStore(
    (state) => state.generateNextRound,
  );
  const connectedClients = useJudgingServerStore(
    (state) => state.connectedClients,
  );
  const assignClientRole = useJudgingServerStore(
    (state) => state.assignClientRole,
  );
  const assignClientAsJudge = useJudgingServerStore(
    (state) => state.assignClientAsJudge,
  );
  const unassignClientAsJudge = useJudgingServerStore(
    (state) => state.unassignClientAsJudge,
  );
  const battleConfigurationId = Array.isArray(params.battleConfigurationId)
    ? params.battleConfigurationId[0]
    : params.battleConfigurationId;
  const configuration = event.battleConfigurations.find(
    (item) => item.id === battleConfigurationId,
  );

  if (!isHost) {
    return <Redirect href="/(auth)/discovery" />;
  }

  if (!configuration) {
    return <Redirect href="/(tabs)/host-battles" />;
  }

  const assignedJudges = judges.filter((judge) =>
    configuration.assignedJudgeIds.includes(judge.id),
  );
  const connectedMcs = connectedClients.filter(
    (client) => client.role === "mc",
  );
  const mcCount = connectedMcs.length + (hasMcRole ? 1 : 0);
  const hasOnlineMc = hasMcRole || connectedMcs.some((client) => client.isOnline);
  const assignJudgeToBattle = async (
    deviceId: string,
    name: string,
  ): Promise<void> => {
    const client = connectedClients.find((item) => item.deviceId === deviceId);

    if (client) {
      await assignClientAsJudge(deviceId, configuration.id);
      return;
    }

    await assignBattleJudge({
      battleConfigurationId: configuration.id,
      deviceId,
      name,
    });
  };
  const unassignJudgeFromBattle = async (deviceId: string): Promise<void> => {
    await unassignClientAsJudge(deviceId, configuration.id);
  };
  const battleParticipants = participants.filter((p) =>
    isInBattleConfiguration(configuration.id, p),
  );
  const presentBattleParticipants = battleParticipants.filter(
    (participant) => participant.checkIn === "present",
  );
  const bracketBattles = battles.filter((b) =>
    isInBattleConfiguration(configuration.id, b),
  );
  const bracketParticipantIds = new Set(
    bracketBattles.flatMap((battle) => battle.participantIds),
  );
  const canGenerateNextRound = canGenerateNextRoundForBattles(bracketBattles);
  const rosterListTitle =
    openRosterList === "participants"
      ? getResource("dashboard_list_participants_title")
      : openRosterList === "judges"
        ? getResource("dashboard_list_judges_title")
        : getResource("dashboard_list_mc_title");
  const participantItems: RosterListItem[] = battleParticipants.map(
    (participant) => ({
      id: participant.id,
      title: `#${String(participant.number).padStart(2, "0")} ${participant.name}`,
      subtitle: [participant.crew, participant.city]
        .filter(Boolean)
        .join(" · "),
      detail: `${participant.status.toUpperCase()} · ${participant.checkIn.toUpperCase()}`,
    }),
  );
  const judgeItems: RosterListItem[] = [
    ...assignedJudges.map((judge) => {
      const client = connectedClients.find(
        (item) => item.deviceId === judge.deviceId,
      );

      return {
        id: judge.id,
        title: judge.name,
        subtitle: `${getResource("configure_battle_role_judge")} · ${judge.role.toUpperCase()}`,
        detail: client
          ? `${client.isOnline ? getResource("dashboard_stat_online") : getResource("dashboard_stat_offline")} · ${client.deviceId}`
          : undefined,
        actions: judge.deviceId
          ? [
              {
                id: `assign_judge_${configuration.id}`,
                label: getResource("dashboard_list_unassign_judge"),
                active: true,
                onPress: () => {
                  void unassignJudgeFromBattle(judge.deviceId!);
                },
              },
              {
                id: "assign_mc",
                label: getResource("dashboard_list_assign_mc"),
                active: client?.role === "mc",
                onPress: () => {
                  void unassignJudgeFromBattle(judge.deviceId!).then(() => {
                    assignClientRole(judge.deviceId!, "mc");
                  });
                },
              },
            ]
          : undefined,
      };
    }),
    ...connectedClients
      .filter(
        (client) =>
          !assignedJudges.some((judge) => judge.deviceId === client.deviceId),
      )
      .map((client) => ({
        id: client.deviceId,
        title: client.name,
        subtitle: `${client.role.toUpperCase()} · ${client.isOnline ? getResource("dashboard_stat_online") : getResource("dashboard_stat_offline")}`,
        detail: client.deviceId,
        actions: [
          {
            id: `assign_judge_${configuration.id}`,
            label: getResource("dashboard_list_assign_judge"),
            onPress: () => {
              void assignJudgeToBattle(client.deviceId, client.name);
            },
          },
          {
            id: "assign_mc",
            label: getResource("dashboard_list_assign_mc"),
            active: client.role === "mc",
            onPress: () => assignClientRole(client.deviceId, "mc"),
          },
        ],
      })),
  ];
  const localMcItems: RosterListItem[] = hasMcRole
    ? [
        {
          id: "host_mc",
          title: getResource("discovery_role_host"),
          subtitle: `${getResource("configure_battle_role_mc")} · ${getResource("dashboard_stat_online")}`,
          detail: getResource("discovery_role_host"),
        },
      ]
    : [];
  const mcItems: RosterListItem[] = [
    ...localMcItems,
    ...connectedClients.map((client) => ({
      id: client.deviceId,
      title: client.name,
      subtitle: `${client.role.toUpperCase()} · ${client.isOnline ? getResource("dashboard_stat_online") : getResource("dashboard_stat_offline")}`,
      detail: client.deviceId,
      actions: [
        {
          id: "assign_mc",
          label: getResource("dashboard_list_assign_mc"),
          active: client.role === "mc",
          onPress: () => assignClientRole(client.deviceId, "mc"),
        },
        {
          id: `assign_judge_${configuration.id}`,
          label: assignedJudges.some(
            (judge) => judge.deviceId === client.deviceId,
          )
            ? getResource("dashboard_list_unassign_judge")
            : getResource("dashboard_list_assign_judge"),
          active: assignedJudges.some(
            (judge) => judge.deviceId === client.deviceId,
          ),
          onPress: () => {
            if (
              assignedJudges.some((judge) => judge.deviceId === client.deviceId)
            ) {
              void unassignJudgeFromBattle(client.deviceId);
              return;
            }

            void assignJudgeToBattle(client.deviceId, client.name);
          },
        },
        {
          id: "assign_spectator",
          label: getResource("dashboard_list_assign_spectator"),
          active: client.role === "spectator",
          onPress: () => {
            if (
              assignedJudges.some((judge) => judge.deviceId === client.deviceId)
            ) {
              void unassignJudgeFromBattle(client.deviceId);
              return;
            }

            assignClientRole(client.deviceId, "spectator");
          },
        },
      ],
    })),
  ];
  const rosterItems =
    openRosterList === "participants"
      ? participantItems
      : openRosterList === "judges"
        ? judgeItems
        : mcItems;

  const handleManageParticipants = (): void => {
    router.push({
      pathname: "/participants",
      params: { battleConfigurationId: configuration.id },
    });
  };

  const ensureBattleContext = async (): Promise<void> => {
    if (event.activeBattleConfigurationId === configuration.id) {
      return;
    }

    await selectBattleConfiguration(configuration.id);
  };

  const handleStartQualification = async (): Promise<void> => {
    await startQualification(configuration.id);
  };

  const handleAssignHostJudge = async (): Promise<void> => {
    const judgeId = await assignBattleJudge({
      battleConfigurationId: configuration.id,
      deviceId: "host",
      name: getResource("configure_battle_host_judge_name"),
    });

    if (judgeId) {
      setRoles([...sessionRoles, "judge"]);
      setSelfJudgeId(judgeId);
    }
  };

  const handleMockQualification = async (): Promise<void> => {
    await ensureBattleContext();
    await fillRandomQualificationScores();
  };

  const openBattleBrackets = async (): Promise<void> => {
    await ensureBattleContext();
    router.push("/(tabs)/brackets");
  };

  const handleGenerateNextRound = async (): Promise<void> => {
    await ensureBattleContext();
    await generateNextRound();
  };

  const canStartQualification =
    configuration.status === "draft" &&
    presentBattleParticipants.length > 0 &&
    assignedJudges.length > 0;
  const startQualificationDisabledReason =
    configuration.status !== "draft"
      ? undefined
      : presentBattleParticipants.length === 0
        ? getResource("battle_dashboard_start_needs_present_participants")
        : assignedJudges.length === 0
          ? getResource("battle_dashboard_start_needs_judge")
          : undefined;
  const hasHostJudge = assignedJudges.some(
    (judge) => judge.deviceId === "host",
  );
  const battleActions: HostMenuAction[] = [
    {
      id: "participants",
      label: getResource("dashboard_action_participants"),
      icon: "people-outline",
      onPress: handleManageParticipants,
    },
    {
      id: "mock-qualification",
      label: getResource("dashboard_action_mock_qualification"),
      icon: "checkmark-done-outline",
      onPress: () => {
        void handleMockQualification();
      },
      disabled:
        configuration.status !== "draft" &&
        configuration.status !== "qualification",
    },
    {
      id: "start-qualification",
      label: getResource("dashboard_action_start_qualification"),
      description: startQualificationDisabledReason,
      icon: "play-outline",
      onPress: () => {
        void handleStartQualification();
      },
      disabled: !canStartQualification,
    },
    {
      id: "select-bracket-participants",
      label: getResource("dashboard_bracket_cta_button"),
      icon: "git-network-outline",
      onPress: () => {
        void openBattleBrackets();
      },
      disabled: configuration.status !== "qualification_finished",
    },
  ];

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Box direction="row" align="center" justify="space-between" mb={24}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text variant="bodyBold">{getResource("battle_dashboard_title")}</Text>
        <HostActionsMenu actions={battleActions} />
      </Box>

      <Box gap={4} mb={20}>
        <Text variant="body2" color="textSecondary">
          {event.title}
        </Text>
        <Text variant="h1">{configuration.categoryTitle}</Text>
        <Text variant="body2" color="textSecondary">
          {statusLabels[configuration.status]} ·{" "}
          {configuration.format?.toUpperCase() ??
            getResource("host_battles_format_pending")}
        </Text>
      </Box>

      <Box direction="row" gap={12} mb={12}>
        <StatCard
          label={getResource("battle_dashboard_participants")}
          value={battleParticipants.length}
          onPress={handleManageParticipants}
        />
        <StatCard
          label={getResource("battle_dashboard_judges")}
          value={assignedJudges.length}
          onPress={() => setOpenRosterList("judges")}
        />
      </Box>
      <Box direction="row" gap={12} mb={20}>
        <StatCard
          label={getResource("dashboard_stat_mc")}
          value={mcCount}
          badge={
            hasOnlineMc
              ? getResource("dashboard_stat_online")
              : getResource("dashboard_stat_offline")
          }
          badgeColor={
            hasOnlineMc
              ? Colors.status.online
              : Colors.text.secondary
          }
          onPress={() => setOpenRosterList("mc")}
        />
      </Box>

      {configuration.status === "qualification" &&
        (hasJudgeRole && hasTimerCompanionRole ? (
          <Box direction="row" gap={12} style={styles.qualificationWidgets}>
            <Box flex={1} style={styles.qualificationWidget}>
              <QualificationControlCard />
            </Box>
            <Box flex={1} style={styles.qualificationWidget}>
              <BattleJudgeScoreCard />
            </Box>
          </Box>
        ) : (
          <>
            <QualificationControlCard />
            {hasJudgeRole && <BattleJudgeScoreCard />}
          </>
        ))}

      <Box style={styles.card} p={16} gap={12} mb={24}>
        <Box direction="row" align="center" justify="space-between" gap={12}>
          <Box gap={4} style={styles.bracketHeader}>
            <Text variant="bodyBold">{getResource("bracket_title")}</Text>
            <Text variant="body2" color="textSecondary">
              {getResource("bracket_participants_prefix")}{" "}
              {String(bracketParticipantIds.size).padStart(2, "0")} /{" "}
              {String(battleParticipants.length).padStart(2, "0")}
            </Text>
          </Box>
          {configuration.status === "battle" && canGenerateNextRound && (
            <Button
              variant="outlined"
              color="secondary"
              onPress={() => {
                void handleGenerateNextRound();
              }}
            >
              {getResource("bracket_next_round_button")}
            </Button>
          )}
        </Box>

        {bracketBattles.length === 0 ? (
          <Box style={styles.placeholder} p={20} align="center">
            <Text variant="body2" color="textSecondary" centered>
              {getResource("bracket_placeholder")}
            </Text>
          </Box>
        ) : (
          roundOrder.map((round) => {
            const roundBattles = bracketBattles.filter(
              (battle) => battle.round === round,
            );

            if (roundBattles.length === 0) {
              return null;
            }

            return (
              <Box key={round} gap={12}>
                <Text variant="body2" color="textSecondary" centered>
                  {roundLabels[round]}
                </Text>
                {roundBattles.map((battle) => (
                  <BattleCard key={battle.id} battle={battle} />
                ))}
              </Box>
            );
          })
        )}
      </Box>

      <Box style={styles.card} p={16} gap={12}>
        <Box direction="row" align="center" justify="space-between" gap={12}>
          <Text variant="bodyBold">{getResource("battle_dashboard_judges")}</Text>
          {configuration.status === "draft" && !hasHostJudge && (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={getResource("dashboard_action_self_assign_judge")}
              style={styles.assignHostJudgeButton}
              onPress={() => {
                void handleAssignHostJudge();
              }}
            >
              <Text variant="body2" color={Colors.secondary.main}>
                {getResource("dashboard_action_self_assign_judge")}
              </Text>
            </TouchableOpacity>
          )}
        </Box>
        {assignedJudges.length === 0 ? (
          <Text variant="body2" color="textSecondary">
            {getResource("battle_dashboard_no_judges")}
          </Text>
        ) : (
          assignedJudges.map((judge) => (
            <Box
              key={judge.id}
              direction="row"
              align="center"
              justify="space-between"
            >
              <Text variant="bodyBold">{judge.name}</Text>
              <Text variant="body2" color="textSecondary">
                {judge.role.toUpperCase()}
              </Text>
            </Box>
          ))
        )}
      </Box>

      <RosterListModal
        visible={openRosterList !== null}
        title={rosterListTitle}
        items={rosterItems}
        onClose={() => setOpenRosterList(null)}
      />
    </ScrollView>
  );
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
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    backgroundColor: Colors.dark.backgroundLight,
  },
  bracketHeader: {
    flex: 1,
  },
  placeholder: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    backgroundColor: Colors.dark.background,
  },
  qualificationWidgets: {
    flexWrap: "wrap",
  },
  qualificationWidget: {
    minWidth: 280,
  },
  assignHostJudgeButton: {
    alignSelf: "flex-start",
    flexShrink: 0,
    minHeight: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.secondary.dark,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
});
