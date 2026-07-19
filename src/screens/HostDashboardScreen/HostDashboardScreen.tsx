import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Box, Text } from '@components';
import Colors from '@constants/Colors';
import { HEADER_HEIGHT, FOOTER_HEIGHT } from '@constants/Dimensions';
import { getResource } from '@resources';
import { useDemoBattleStore } from '@stores/demoBattle/useDemoBattleStore';
import { useJudgingServerStore } from '@stores/judgingServer/useJudgingServerStore';
import { useSessionStore } from '@stores/session/useSessionStore';
import { StatCard } from './StatCard';
import { HostLocalJudgeView } from './HostLocalJudgeView';
import { HostLocalMCView } from './HostLocalMCView';
import { HostLocalSpectatorView } from './HostLocalSpectatorView';
import { HostViewSwitcher } from './HostViewSwitcher';
import { RosterListModal, type RosterListItem } from './RosterListModal';
import { ServerStatusCard } from './ServerStatusCard';
import { SystemLogsCard } from './SystemLogsCard';

const STATUS_LABELS: Record<string, string> = {
  draft: getResource('dashboard_status_draft'),
  qualification: getResource('dashboard_status_qualification'),
  qualification_finished: getResource('dashboard_status_ranking'),
  battle: getResource('dashboard_status_battles'),
  finished: getResource('dashboard_status_finished'),
};

const CLIENT_ROLE_LABELS = {
  judge: getResource('configure_battle_role_judge'),
  mc: getResource('configure_battle_role_mc'),
  spectator: getResource('discovery_role_spectator'),
};

type EventRosterList = 'connected' | 'judges' | 'mc' | 'spectators';

export const HostDashboardScreen: React.FC = () => {
  const router = useRouter();
  const [openRosterList, setOpenRosterList] = useState<EventRosterList | null>(null);
  const sessionRoles = useSessionStore(s => s.roles);
  const isHost = useSessionStore(s => s.roles.includes('host'));
  const activeViewRole = useSessionStore(s => s.activeViewRole ?? 'host');
  const event = useDemoBattleStore(s => s.event);
  const judges = useDemoBattleStore(s => s.judges);
  const assignBattleJudge = useDemoBattleStore(s => s.assignBattleJudge);
  const renameBattleJudge = useDemoBattleStore(s => s.renameBattleJudge);
  const connectedClients = useJudgingServerStore(s => s.connectedClients);
  const renameClient = useJudgingServerStore(s => s.renameClient);
  const assignClientRole = useJudgingServerStore(s => s.assignClientRole);
  const assignClientAsJudge = useJudgingServerStore(s => s.assignClientAsJudge);
  const unassignClientAsJudge = useJudgingServerStore(s => s.unassignClientAsJudge);

  useEffect(() => {
    if (!isHost) {
      router.replace('/(auth)/discovery');
    }
  }, [isHost, router]);

  const onlineClients = connectedClients.filter(c => c.isOnline);
  const onlineJudges = connectedClients.filter(c => c.role === 'judge' && c.isOnline);
  const connectedMcs = connectedClients.filter(c => c.role === 'mc');
  const hasLocalMcRole = sessionRoles.includes('mc');
  const mcCount = connectedMcs.length + (hasLocalMcRole ? 1 : 0);
  const hasOnlineMc = hasLocalMcRole || connectedMcs.some(c => c.isOnline);
  const spectators = connectedClients.filter(c => c.role === 'spectator' && c.isOnline);
  const battleConfigurations = event.battleConfigurations;
  const isJudgeAssignedToBattle = (
    judgeId: string | undefined,
    battleConfigurationId: string,
  ): boolean => {
    if (!judgeId) {
      return false;
    }

    return battleConfigurations.some(
      (configuration) =>
        configuration.id === battleConfigurationId &&
        configuration.assignedJudgeIds.includes(judgeId),
    );
  };
  const getAssignedJudgeForClientBattle = (
    deviceId: string,
    battleConfigurationId: string,
  ) =>
    judges.find(
      (judge) =>
        judge.deviceId === deviceId &&
        isJudgeAssignedToBattle(judge.id, battleConfigurationId),
    );
  const assignJudgeToBattle = async (
    deviceId: string,
    name: string,
    battleConfigurationId: string,
  ): Promise<void> => {
    const client = connectedClients.find((item) => item.deviceId === deviceId);

    if (client) {
      await assignClientAsJudge(deviceId, battleConfigurationId);
      return;
    }

    await assignBattleJudge({
      battleConfigurationId,
      deviceId,
      name,
    });
  };
  const unassignJudgeFromBattle = async (
    deviceId: string,
    battleConfigurationId?: string,
  ): Promise<void> => {
    await unassignClientAsJudge(deviceId, battleConfigurationId);
  };
  const renameConnectedClient = async (
    deviceId: string,
    name: string,
  ): Promise<void> => {
    const nextName = name.trim();

    if (nextName.length === 0) {
      return;
    }

    renameClient(deviceId, nextName);

    const assignedJudges = judges.filter(
      (judge) =>
        judge.deviceId === deviceId &&
        battleConfigurations.some((configuration) =>
          isJudgeAssignedToBattle(judge.id, configuration.id),
        ),
    );

    for (const judge of assignedJudges) {
      const assignedConfigurations = battleConfigurations.filter(
        (configuration) =>
          isJudgeAssignedToBattle(judge.id, configuration.id),
      );

      for (const configuration of assignedConfigurations) {
        await assignBattleJudge({
          battleConfigurationId: configuration.id,
          deviceId,
          name: nextName,
        });
      }
    }
  };
  const rosterListTitle =
    openRosterList === 'judges'
      ? getResource('dashboard_list_judges_title')
      : openRosterList === 'mc'
        ? getResource('dashboard_list_mc_title')
        : openRosterList === 'spectators'
          ? getResource('dashboard_list_spectators_title')
          : getResource('dashboard_list_connected_title');
  const selectedClients = connectedClients.filter((client) => {
    if (openRosterList === 'judges') return client.role === 'judge';
    if (openRosterList === 'mc') return client.role === 'mc';
    if (openRosterList === 'spectators') return client.role === 'spectator';
    return true;
  });
  const connectedClientItems: RosterListItem[] = selectedClients.map((client) => {
    const assignedJudge = client.judgeId
      ? judges.find((judge) => judge.id === client.judgeId)
      : null;
    const judgeActions = battleConfigurations.map((battleConfiguration) => {
      const isAssignedToBattle = assignedJudge
        ? isJudgeAssignedToBattle(assignedJudge.id, battleConfiguration.id)
        : false;

      return {
        id: `assign_judge_${battleConfiguration.id}`,
        label: battleConfiguration.categoryTitle,
        active: isAssignedToBattle,
        onPress: () => {
          if (isAssignedToBattle) {
            void unassignJudgeFromBattle(
              client.deviceId,
              battleConfiguration.id,
            );
            return;
          }

          void assignJudgeToBattle(
            client.deviceId,
            client.name,
            battleConfiguration.id,
          );
        },
      };
    });

    return {
      id: client.deviceId,
      title: client.name,
      subtitle: `${CLIENT_ROLE_LABELS[client.role]} · ${client.isOnline ? getResource('dashboard_stat_online') : getResource('dashboard_stat_offline')}`,
      detail: client.deviceId,
      onRename: (name) => {
        void renameConnectedClient(client.deviceId, name);
      },
      actions: [
        ...judgeActions,
        {
          id: 'assign_mc',
          label: getResource('dashboard_list_assign_mc'),
          active: client.role === 'mc',
          onPress: () => {
            if (assignedJudge) {
              void unassignJudgeFromBattle(
                client.deviceId,
                assignedJudge.battleConfigurationId,
              ).then(() => {
                assignClientRole(client.deviceId, 'mc');
              });
              return;
            }

            assignClientRole(client.deviceId, 'mc');
          },
        },
        {
          id: 'assign_spectator',
          label: getResource('dashboard_list_assign_spectator'),
          active: client.role === 'spectator',
          onPress: () => {
            if (assignedJudge) {
              void unassignJudgeFromBattle(
                client.deviceId,
                assignedJudge.battleConfigurationId,
              );
              return;
            }

            assignClientRole(client.deviceId, 'spectator');
          },
        },
      ],
    };
  });
  const localMcItems: RosterListItem[] = hasLocalMcRole
    ? [
        {
          id: 'host_mc',
          title: getResource('discovery_role_host'),
          subtitle: `${getResource('configure_battle_role_mc')} · ${getResource('dashboard_stat_online')}`,
          detail: getResource('discovery_role_host'),
        },
      ]
    : [];
  const assignedJudgeItems: RosterListItem[] = judges
    .filter((judge) =>
      battleConfigurations.some((configuration) =>
        configuration.assignedJudgeIds.includes(judge.id),
      ) &&
      !connectedClients.some((client) => client.deviceId === judge.deviceId),
    )
    .map((judge) => {
      const configuration = battleConfigurations.find(
        (item) => item.assignedJudgeIds.includes(judge.id),
      );
      const client = connectedClients.find(
        (item) => item.deviceId === judge.deviceId,
      );

      return {
        id: judge.id,
        title: judge.name,
        subtitle: `${getResource('configure_battle_role_judge')} · ${configuration?.categoryTitle ?? event.title}`,
        detail: client
          ? `${client.isOnline ? getResource('dashboard_stat_online') : getResource('dashboard_stat_offline')} · ${client.deviceId}`
          : judge.role.toUpperCase(),
        onRename: (name) => {
          void renameBattleJudge({
            judgeId: judge.id,
            name,
          });
        },
        actions: judge.deviceId
          ? battleConfigurations.map((battleConfiguration) => ({
              id: `assign_judge_${battleConfiguration.id}`,
              label: battleConfiguration.categoryTitle,
              active: isJudgeAssignedToBattle(judge.id, battleConfiguration.id),
              onPress: () => {
                if (isJudgeAssignedToBattle(judge.id, battleConfiguration.id)) {
                  void unassignJudgeFromBattle(
                    judge.deviceId!,
                    battleConfiguration.id,
                  );
                  return;
                }

                void assignJudgeToBattle(
                  judge.deviceId!,
                  judge.name,
                  battleConfiguration.id,
                );
              },
            }))
          : undefined,
      };
    });
  const judgeCandidateItems: RosterListItem[] = connectedClients.map((client) => ({
    id: `candidate_${client.deviceId}`,
    title: client.name,
    subtitle: `${CLIENT_ROLE_LABELS[client.role]} · ${client.isOnline ? getResource('dashboard_stat_online') : getResource('dashboard_stat_offline')}`,
    detail: client.deviceId,
    onRename: (name) => {
      void renameConnectedClient(client.deviceId, name);
    },
    actions: battleConfigurations.map((configuration) => ({
      id: `assign_judge_${configuration.id}`,
      label: configuration.categoryTitle,
      active:
        getAssignedJudgeForClientBattle(client.deviceId, configuration.id) !==
        undefined,
      onPress: () => {
        const assignedJudge = getAssignedJudgeForClientBattle(
          client.deviceId,
          configuration.id,
        );

        if (assignedJudge) {
          void unassignJudgeFromBattle(client.deviceId, configuration.id);
          return;
        }

        void assignJudgeToBattle(
          client.deviceId,
          client.name,
          configuration.id,
        );
      },
    })),
  }));
  const rosterItems: RosterListItem[] =
    openRosterList === 'judges'
      ? [...judgeCandidateItems, ...assignedJudgeItems]
      : openRosterList === 'mc'
        ? [...localMcItems, ...connectedClientItems]
      : connectedClientItems;

  if (activeViewRole !== 'host') {
    return (
      <Box fullHeight color={Colors.dark.background} pt={HEADER_HEIGHT + 24}>
        <Box px={24} mb={20}>
          <HostViewSwitcher />
        </Box>
        {activeViewRole === 'mc' && <HostLocalMCView />}
        {activeViewRole === 'judge' && <HostLocalJudgeView />}
        {activeViewRole === 'spectator' && <HostLocalSpectatorView />}
      </Box>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Box direction="row" align="center" gap={12} mb={24}>
        <Box style={styles.viewSwitcher}>
          <HostViewSwitcher />
        </Box>
      </Box>

      <Box gap={4} mb={24}>
        <Text variant="body2" color="textSecondary">{getResource('dashboard_event_live')}</Text>
        <Text variant="h1">{event.title}</Text>
        <Text variant="body2" color="textSecondary">
          {getResource('dashboard_stage_prefix')} {STATUS_LABELS[event.status] ?? event.status}
        </Text>
      </Box>

      <Box direction="row" gap={12} mb={12}>
        <StatCard
          label={getResource('dashboard_stat_connected')}
          value={connectedClients.length}
          badge={`${onlineClients.length} ${getResource('dashboard_stat_online')}`}
          badgeColor={Colors.status.online}
          onPress={() => setOpenRosterList('connected')}
        />
        <StatCard
          label={getResource('dashboard_stat_judges')}
          value={judges.length}
          badge={`${onlineJudges.length}/${judges.length} online`}
          badgeColor={Colors.primary.main}
          onPress={() => setOpenRosterList('judges')}
        />
      </Box>
      <Box direction="row" gap={12} mb={24}>
        <StatCard
          label={getResource('dashboard_stat_mc')}
          value={mcCount}
          badge={hasOnlineMc ? getResource('dashboard_stat_online') : getResource('dashboard_stat_offline')}
          badgeColor={hasOnlineMc ? Colors.status.online : Colors.text.secondary}
          onPress={() => setOpenRosterList('mc')}
        />
        <StatCard
          label={getResource('dashboard_stat_spectators')}
          value={spectators.length}
          badge={getResource('dashboard_stat_live_feed')}
          badgeColor={Colors.secondary.main}
          onPress={() => setOpenRosterList('spectators')}
        />
      </Box>

      {event.status === 'draft' && (
        <Box style={styles.hero} p={24} gap={8} mb={24} align="center">
          <Text variant="h1" centered>{getResource('dashboard_hero_title')}</Text>
          <Text variant="body2" color="textSecondary" centered>{getResource('dashboard_hero_status')}</Text>
        </Box>
      )}

      <Box mb={16}>
        <ServerStatusCard />
      </Box>

      <Box style={styles.assignmentCard} p={16} gap={12} mb={16}>
        <Text variant="bodyBold">{getResource('dashboard_connected_users_title')}</Text>
        {connectedClients.length === 0 ? (
          <Text variant="body2" color="textSecondary">
            {getResource('dashboard_connected_users_empty')}
          </Text>
        ) : (
          connectedClients.map((client) => (
            <Box key={client.deviceId} style={styles.clientRow} gap={10}>
              <Box direction="row" align="center" justify="space-between" gap={12}>
                <Box style={styles.clientName}>
                  <Text variant="bodyBold">{client.name}</Text>
                  <Text variant="body2" color="textSecondary">
                    {CLIENT_ROLE_LABELS[client.role]} · {client.isOnline ? getResource('dashboard_stat_online') : getResource('dashboard_stat_offline')}
                  </Text>
                </Box>
              </Box>
              <Box direction="row" gap={8} style={styles.roleActions}>
                <TouchableOpacity
                  style={[styles.roleButton, client.role === 'judge' && styles.roleButtonActive]}
                  onPress={() => {
                    if (client.role === 'judge') {
                      void unassignJudgeFromBattle(client.deviceId, client.judgeId
                        ? judges.find((judge) => judge.id === client.judgeId)
                          ?.battleConfigurationId
                        : undefined);
                      return;
                    }

                    if (battleConfigurations.length === 1) {
                      void assignClientAsJudge(
                        client.deviceId,
                        battleConfigurations[0].id,
                      );
                      return;
                    }

                    if (battleConfigurations.length > 1) {
                      setOpenRosterList('judges');
                    }
                  }}
                >
                  <Text variant="body2" style={styles.roleButtonText} numberOfLines={1}>
                    {getResource('configure_battle_role_judge')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleButton, client.role === 'mc' && styles.roleButtonActive]}
                  onPress={() => {
                    const assignedJudge = client.judgeId
                      ? judges.find((judge) => judge.id === client.judgeId)
                      : null;

                    if (assignedJudge) {
                      void unassignJudgeFromBattle(
                        client.deviceId,
                        assignedJudge.battleConfigurationId,
                      ).then(() => {
                        assignClientRole(client.deviceId, 'mc');
                      });
                      return;
                    }

                    assignClientRole(client.deviceId, 'mc');
                  }}
                >
                  <Text variant="body2" style={styles.roleButtonText} numberOfLines={1}>
                    {getResource('configure_battle_role_mc')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleButton, client.role === 'spectator' && styles.roleButtonActive]}
                  onPress={() => {
                    const assignedJudge = client.judgeId
                      ? judges.find((judge) => judge.id === client.judgeId)
                      : null;

                    if (assignedJudge) {
                      void unassignJudgeFromBattle(
                        client.deviceId,
                        assignedJudge.battleConfigurationId,
                      );
                      return;
                    }

                    assignClientRole(client.deviceId, 'spectator');
                  }}
                >
                  <Text variant="body2" style={styles.roleButtonText} numberOfLines={1}>
                    {getResource('discovery_role_spectator')}
                  </Text>
                </TouchableOpacity>
              </Box>
            </Box>
          ))
        )}
      </Box>

      <SystemLogsCard />
      <RosterListModal
        visible={openRosterList !== null}
        title={rosterListTitle}
        items={rosterItems}
        onClose={() => setOpenRosterList(null)}
      />
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
  hero: {
    backgroundColor: Colors.dark.backgroundLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  viewSwitcher: {
    flex: 1,
  },
  assignmentCard: {
    backgroundColor: Colors.dark.backgroundLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  clientRow: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border.subtle,
  },
  clientName: {
    flex: 1,
  },
  roleButton: {
    flex: 1,
    minHeight: 40,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    backgroundColor: Colors.dark.background,
  },
  roleActions: {
    alignItems: 'stretch',
  },
  roleButtonText: {
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.56,
    textAlign: 'center',
  },
  roleButtonActive: {
    borderColor: Colors.primary.main,
    backgroundColor: Colors.primary.dark,
  },
});
