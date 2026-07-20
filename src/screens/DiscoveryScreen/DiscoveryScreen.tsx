import { Alert, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Box, Button, Text } from '@components';
import Colors from '@constants/Colors';
import { FOOTER_HEIGHT, HEADER_HEIGHT } from '@constants/Dimensions';
import { getResource } from '@resources';
import { useSessionStore } from '@stores/session/useSessionStore';
import { useJudgingServerStore } from '@stores/judgingServer/useJudgingServerStore';
import { useJudgingClientStore } from '@stores/judgingClient/useJudgingClientStore';
import { useDemoBattleStore } from '@stores/demoBattle/useDemoBattleStore';
import type { AppRole } from '@domain/role/types';
import { resetAppSession } from '../../shared/session/resetAppSession';

export const DiscoveryScreen: React.FC = () => {
  const router = useRouter();
  const setRole = useSessionStore(s => s.setRole);
  const setRoles = useSessionStore(s => s.setRoles);
  const setSelfJudgeId = useSessionStore(s => s.setSelfJudgeId);
  const lastHostRoles = useSessionStore(s => s.lastHostRoles);
  const lastHostSelfJudgeId = useSessionStore(s => s.lastHostSelfJudgeId);
  const hasCreatedEvent = useDemoBattleStore(s =>
    s.eventLog.some(appEvent => appEvent.type === 'event.created'),
  );
  const serverStatus = useJudgingServerStore(s => s.status);
  const connectionInfo = useJudgingServerStore(s => s.connectionInfo);
  const connectToHost = useJudgingClientStore(s => s.connectToHost);
  const resetConnectionTarget = useJudgingClientStore(
    s => s.resetConnectionTarget,
  );
  const deleteLocalEvent = useDemoBattleStore(s => s.deleteLocalEvent);
  const localEventTitle = useDemoBattleStore(s => s.event.title.trim());

  const isLocalServerRunning = serverStatus === 'running' && connectionInfo !== null;
  const canRestoreStoredOwnEvent = hasCreatedEvent;
  const ownLocalEventRoles: AppRole[] = lastHostRoles.includes('host')
    ? lastHostRoles
    : ['host', 'spectator'];
  const canRestoreOwnLocalEvent = canRestoreStoredOwnEvent;
  const canDeleteOwnLocalEvent = canRestoreStoredOwnEvent;
  const localEventDescription = canRestoreStoredOwnEvent
    ? getResource('discovery_local_reconnect')
    : getResource('discovery_local_detected');

  const handleCreateEvent = () => {
    setRole('host');
    router.push('/create-event');
  };

  const handleJoinLocal = () => {
    if (connectionInfo === null) return;
    setRole('spectator');
    connectToHost({
      host: connectionInfo.host,
      port: connectionInfo.port,
      role: 'spectator',
      name: `Demo ${getResource('discovery_role_spectator')}`,
    });
    router.replace('/(tabs)');
  };

  const handleConnectToOwnLocalEvent = () => {
    setRole('host');
    setRoles(ownLocalEventRoles);
    setSelfJudgeId(
      ownLocalEventRoles.includes('judge') ? lastHostSelfJudgeId : null,
    );
    router.replace('/(tabs)');
  };

  const handleDeleteLocalEvent = () => {
    Alert.alert(
      getResource('discovery_delete_local_title'),
      getResource('discovery_delete_local_message'),
      [
        {
          text: getResource('discovery_delete_local_cancel'),
          style: 'cancel',
        },
        {
          text: getResource('discovery_delete_local_confirm'),
          style: 'destructive',
          onPress: () => {
            resetAppSession();
            void deleteLocalEvent();
          },
        },
      ],
    );
  };

  const handleScanQr = () => {
    router.push('/scan-qr');
  };

  const handleEnterManually = () => {
    setRole('spectator');
    resetConnectionTarget();
    if (Platform.OS === 'web' && __DEV__) {
      connectToHost({
        host: 'web-preview',
        port: 0,
        role: 'spectator',
        name: `Web ${getResource('discovery_role_spectator')}`,
      });
    }
    router.push('/(tabs)/live');
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Box gap={4} mb={40}>
        <Text variant="h1" color="primary">
          {getResource('discovery_title')}
        </Text>
        <Text variant="body2" color="textSecondary">
          {getResource('discovery_subtitle')}
        </Text>
      </Box>

      {canRestoreOwnLocalEvent && (
        <Box style={styles.localCard} p={16} gap={12} mb={32}>
          <Box direction="row" align="flex-start" justify="space-between" gap={12}>
            <Box flex={1} gap={6}>
              <Box direction="row" align="center" gap={8}>
                <View style={styles.onlineDot} />
                <Text variant="bodyBold" numberOfLines={2}>
                  {localEventTitle.length > 0
                    ? localEventTitle
                    : getResource('discovery_local_reconnect')}
                </Text>
              </Box>
              <Text variant="body2" color="textSecondary">
                {localEventDescription}
              </Text>
            </Box>
            {canDeleteOwnLocalEvent && (
              <TouchableOpacity
                style={styles.deleteButton}
                accessibilityRole="button"
                onPress={handleDeleteLocalEvent}
              >
                <Ionicons name="trash-outline" size={20} color={Colors.error.main} />
              </TouchableOpacity>
            )}
          </Box>

          {!isLocalServerRunning || canRestoreStoredOwnEvent ? (
            <Button onPress={handleConnectToOwnLocalEvent}>
              {getResource('discovery_connect_own_local')}
            </Button>
          ) : (
            <Button onPress={handleJoinLocal}>
              {getResource('discovery_join_local')}
            </Button>
          )}
        </Box>
      )}

      <Box gap={12} mb={32}>
        <Text variant="body2" color="textSecondary">
          {getResource('discovery_host_section')}
        </Text>
        <Button onPress={handleCreateEvent}>
          {getResource('discovery_create_event')}
        </Button>
      </Box>

      <Box gap={12}>
        <Text variant="body2" color="textSecondary">
          {getResource('discovery_join_section')}
        </Text>
        <Button variant="outlined" color="secondary" onPress={handleScanQr}>
          {getResource('discovery_scan_qr')}
        </Button>
        <Button variant="outlined" color="secondary" onPress={handleEnterManually}>
          {getResource('discovery_enter_manual')}
        </Button>
      </Box>
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
  localCard: {
    backgroundColor: Colors.dark.backgroundLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.status.online,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.status.online,
  },
  deleteButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    backgroundColor: Colors.dark.background,
  },
});
