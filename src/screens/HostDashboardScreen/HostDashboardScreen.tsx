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
  const role = useSessionStore(s => s.role);
  const activeViewRole = useSessionStore(s => s.activeViewRole ?? 'host');
  const event = useDemoBattleStore(s => s.event);
  const judges = useDemoBattleStore(s => s.judges);
  const assignBattleJudge = useDemoBattleStore(s => s.assignBattleJudge);
  const connectedClients = useJudgingServerStore(s => s.connectedClients);
  const assignClientRole = useJudgingServerStore(s => s.assignClientRole);
  const assignClientAsJudge = useJudgingServerStore(s => s.assignClientAsJudge);

  useEffect(() => {
    if (role !== 'host') {
      router.replace('/(auth)/role-selection');
    }
  }, [role, router]);

  const onlineClients = connectedClients.filter(c => c.isOnline);
  const onlineJudges = connectedClients.filter(c => c.role === 'judge' && c.isOnline);
  const mc = connectedClients.find(c => c.role === 'mc');
  const spectators = connectedClients.filter(c => c.role === 'spectator' && c.isOnline);
  const battleConfigurations = event.battleConfigurations;
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
  const connectedClientItems: RosterListItem[] = selectedClients.map((client) => ({
    id: client.deviceId,
    title: client.name,
    subtitle: `${CLIENT_ROLE_LABELS[client.role]} · ${client.isOnline ? getResource('dashboard_stat_online') : getResource('dashboard_stat_offline')}`,
    detail: client.deviceId,
    actions: [
      {
        id: 'assign_judge',
        label: getResource('dashboard_list_assign_judge'),
        active: client.role === 'judge',
        onPress: () => {
          const firstBattleConfiguration = battleConfigurations[0];

          if (!firstBattleConfiguration) {
            void assignClientAsJudge(client.deviceId);
            return;
          }

          void assignJudgeToBattle(
            client.deviceId,
            client.name,
            firstBattleConfiguration.id,
          );
        },
      },
      {
        id: 'assign_mc',
        label: getResource('dashboard_list_assign_mc'),
        active: client.role === 'mc',
        onPress: () => assignClientRole(client.deviceId, 'mc'),
      },
      {
        id: 'assign_spectator',
        label: getResource('dashboard_list_assign_spectator'),
        active: client.role === 'spectator',
        onPress: () => assignClientRole(client.deviceId, 'spectator'),
      },
    ],
  }));
  const assignedJudgeItems: RosterListItem[] = judges.map((judge) => {
    const configuration = battleConfigurations.find(
      (item) => item.id === judge.battleConfigurationId,
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
      actions: judge.deviceId
        ? battleConfigurations.map((battleConfiguration) => ({
            id: `assign_judge_${battleConfiguration.id}`,
            label: battleConfiguration.categoryTitle,
            active: judge.battleConfigurationId === battleConfiguration.id,
            onPress: () => {
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
    actions: battleConfigurations.map((configuration) => ({
      id: `assign_judge_${configuration.id}`,
      label: configuration.categoryTitle,
      active: judges.some(
        (judge) =>
          judge.deviceId === client.deviceId &&
          judge.battleConfigurationId === configuration.id,
      ),
      onPress: () => {
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
          value={onlineClients.length}
          badge={getResource('dashboard_stat_active')}
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
          value={mc !== undefined ? '1' : '0'}
          badge={mc?.isOnline === true ? getResource('dashboard_stat_online') : getResource('dashboard_stat_offline')}
          badgeColor={mc?.isOnline === true ? Colors.status.online : Colors.text.secondary}
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
              <Box direction="row" gap={8}>
                <TouchableOpacity
                  style={[styles.roleButton, client.role === 'judge' && styles.roleButtonActive]}
                  onPress={() => void assignClientAsJudge(client.deviceId)}
                >
                  <Text variant="body2">{getResource('configure_battle_role_judge')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleButton, client.role === 'mc' && styles.roleButtonActive]}
                  onPress={() => assignClientRole(client.deviceId, 'mc')}
                >
                  <Text variant="body2">{getResource('configure_battle_role_mc')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleButton, client.role === 'spectator' && styles.roleButtonActive]}
                  onPress={() => assignClientRole(client.deviceId, 'spectator')}
                >
                  <Text variant="body2">{getResource('discovery_role_spectator')}</Text>
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
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    backgroundColor: Colors.dark.background,
  },
  roleButtonActive: {
    borderColor: Colors.primary.main,
    backgroundColor: Colors.primary.dark,
  },
});
