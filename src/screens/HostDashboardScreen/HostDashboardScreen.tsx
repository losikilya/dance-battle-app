import { ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Box, Text } from '@components';
import Colors from '@constants/Colors';
import { HEADER_HEIGHT, FOOTER_HEIGHT } from '@constants/Dimensions';
import { getResource } from '@resources';
import { useDemoBattleStore } from '@stores/demoBattle/useDemoBattleStore';
import { useJudgingServerStore } from '@stores/judgingServer/useJudgingServerStore';
import { useSessionStore } from '@stores/session/useSessionStore';
import { StatCard } from './StatCard';
import { ActionButton } from './ActionButton';
import { ServerStatusCard } from './ServerStatusCard';
import { SystemLogsCard } from './SystemLogsCard';

const STATUS_LABELS: Record<string, string> = {
  draft: 'DRAFT',
  qualification: 'QUALIFICATION',
  qualification_finished: 'RANKING',
  battle: 'BATTLES',
  finished: 'FINISHED',
};

export const HostDashboardScreen: React.FC = () => {
  const router = useRouter();
  const role = useSessionStore(s => s.role);
  const event = useDemoBattleStore(s => s.event);
  const judges = useDemoBattleStore(s => s.judges);
  const canStartQualification = useDemoBattleStore(s => s.canStartQualification);
  const canGenerateTop8 = useDemoBattleStore(s => s.canGenerateTop8);
  const startQualification = useDemoBattleStore(s => s.startQualification);
  const generateTop8 = useDemoBattleStore(s => s.generateTop8);
  const connectedClients = useJudgingServerStore(s => s.connectedClients);

  if (role !== 'host') {
    router.replace('/(auth)/role-selection');
    return null;
  }

  const onlineClients = connectedClients.filter(c => c.isOnline);
  const onlineJudges = connectedClients.filter(c => c.role === 'judge' && c.isOnline);
  const mc = connectedClients.find(c => c.role === 'mc');
  const spectators = connectedClients.filter(c => c.role === 'spectator' && c.isOnline);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
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
        />
        <StatCard
          label={getResource('dashboard_stat_judges')}
          value={judges.length}
          badge={`${onlineJudges.length}/${judges.length} online`}
          badgeColor={Colors.primary.main}
        />
      </Box>
      <Box direction="row" gap={12} mb={24}>
        <StatCard
          label={getResource('dashboard_stat_mc')}
          value={mc !== undefined ? '1' : '0'}
          badge={mc?.isOnline === true ? getResource('dashboard_stat_online') : getResource('dashboard_stat_offline')}
          badgeColor={mc?.isOnline === true ? Colors.status.online : Colors.text.secondary}
        />
        <StatCard
          label={getResource('dashboard_stat_spectators')}
          value={spectators.length}
          badge={getResource('dashboard_stat_live_feed')}
          badgeColor={Colors.secondary.main}
        />
      </Box>

      <Box gap={12} mb={24}>
        <ActionButton
          label={getResource('dashboard_action_participants')}
          icon="people-outline"
          onPress={() => router.push('/participants')}
        />
        <ActionButton
          label={getResource('dashboard_action_start_qualification')}
          icon="play-outline"
          onPress={startQualification}
          disabled={!canStartQualification()}
        />
        <ActionButton
          label={getResource('dashboard_action_generate_top8')}
          icon="git-network-outline"
          onPress={generateTop8}
          disabled={!canGenerateTop8()}
        />
        <ActionButton
          label={getResource('dashboard_action_start_battles')}
          icon="flash-outline"
          onPress={() => router.push('/(tabs)/brackets')}
          disabled={event.status !== 'battle'}
        />
        <ActionButton
          label={getResource('dashboard_action_show_qr')}
          icon="qr-code-outline"
          onPress={() => router.push('/profile/judge')}
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

      <SystemLogsCard />
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
});
