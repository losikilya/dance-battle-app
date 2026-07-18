import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Box, Button, Text } from '@components';
import Colors from '@constants/Colors';
import { HEADER_HEIGHT, FOOTER_HEIGHT } from '@constants/Dimensions';
import { getResource } from '@resources';
import type { BattleConfiguration, EventStatus } from '@domain/event/types';
import { useDemoBattleStore } from '@stores/demoBattle/useDemoBattleStore';

function formatBattleStatus(configuration: BattleConfiguration): string {
  return configuration.format?.toUpperCase() ??
    getResource('host_battles_format_pending');
}

const statusLabels: Record<EventStatus, string> = {
  draft: getResource('dashboard_status_draft'),
  qualification: getResource('dashboard_status_qualification'),
  qualification_finished: getResource('dashboard_status_ranking'),
  battle: getResource('dashboard_status_battles'),
  finished: getResource('dashboard_status_finished'),
};

export function HostBattlesScreen(): React.JSX.Element {
  const router = useRouter();
  const judges = useDemoBattleStore((state) => state.judges);
  const battles = useDemoBattleStore((state) => state.battles);
  const configurations = useDemoBattleStore(
    (state) => state.event.battleConfigurations,
  );

  const openBattleDashboard = (battleConfigurationId: string): void => {
    router.push({
      pathname: '/battle-dashboard',
      params: { battleConfigurationId },
    });
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Box gap={4} mb={20}>
        <Text variant="body2" color="textSecondary">
          {getResource('host_battles_overline')}
        </Text>
        <Text variant="h1">{getResource('host_battles_title')}</Text>
      </Box>

      <Button
        onPress={() => router.push('/configure-battle')}
        style={styles.createButton}
      >
        {getResource('host_battles_create')}
      </Button>

      <Box gap={12}>
        {configurations.length === 0 ? (
          <Box style={styles.emptyCard} p={20} gap={8}>
            <Text variant="bodyBold">{getResource('host_battles_empty_title')}</Text>
            <Text variant="body2" color="textSecondary">
              {getResource('host_battles_empty_body')}
            </Text>
          </Box>
        ) : (
          configurations.map((configuration) => {
            const assignedJudges = judges.filter((judge) =>
              configuration.assignedJudgeIds.includes(judge.id),
            );
            const isLive =
              configuration.status === 'qualification' ||
              battles.some(
                (battle) =>
                  battle.battleConfigurationId === configuration.id &&
                  (battle.status === 'active' || battle.status === 'voting'),
              );

            return (
              <TouchableOpacity
                key={configuration.id}
                style={styles.battleCard}
                onPress={() => openBattleDashboard(configuration.id)}
                accessibilityRole="button"
              >
                <Box direction="row" align="center" justify="space-between" gap={12}>
                  <Box style={styles.battleInfo} direction="row" align="center" gap={10}>
                    <Box
                      style={{
                        ...styles.statusDot,
                        ...(isLive ? styles.statusDotLive : {}),
                      }}
                    />
                    <Box style={styles.battleText} gap={4}>
                      <Text variant="bodyBold">{configuration.categoryTitle}</Text>
                      <Text variant="body2" color="textSecondary">
                        {statusLabels[configuration.status]} · {formatBattleStatus(configuration)} · {assignedJudges.length} {getResource('host_battles_judges_suffix')}
                      </Text>
                    </Box>
                  </Box>
                  <Ionicons
                    name="chevron-forward"
                    size={22}
                    color={Colors.text.primary}
                  />
                </Box>
              </TouchableOpacity>
            );
          })
        )}
      </Box>

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
  createButton: {
    marginBottom: 20,
  },
  emptyCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    backgroundColor: Colors.dark.backgroundLight,
  },
  battleCard: {
    minHeight: 76,
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    backgroundColor: Colors.dark.backgroundLight,
  },
  battleInfo: {
    flex: 1,
  },
  battleText: {
    flex: 1,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.border.subtle,
  },
  statusDotLive: {
    backgroundColor: Colors.status.online,
  },
});
