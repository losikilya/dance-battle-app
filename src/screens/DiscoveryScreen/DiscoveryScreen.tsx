import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Box, Button, Text } from '@components';
import Colors from '@constants/Colors';
import { FOOTER_HEIGHT, HEADER_HEIGHT } from '@constants/Dimensions';
import { getResource } from '@resources';
import { useSessionStore } from '@stores/session/useSessionStore';
import { useJudgingServerStore } from '@stores/judgingServer/useJudgingServerStore';
import { useJudgingClientStore } from '@stores/judgingClient/useJudgingClientStore';
import type { ClientRole } from '@domain/sync/wsProtocol';

const CLIENT_ROLES: ClientRole[] = ['judge', 'mc', 'spectator'];
const ROLE_LABELS: Record<ClientRole, string> = {
  judge: 'JUDGE',
  mc: 'MC',
  spectator: 'SPECTATOR',
};

export const DiscoveryScreen: React.FC = () => {
  const router = useRouter();
  const setRole = useSessionStore(s => s.setRole);
  const serverStatus = useJudgingServerStore(s => s.status);
  const serverPort = useJudgingServerStore(s => s.port);
  const connectToHost = useJudgingClientStore(s => s.connectToHost);

  const isLocalServerRunning = serverStatus === 'running';
  const [selectedRole, setSelectedRole] = useState<ClientRole>('judge');

  const handleCreateEvent = () => {
    setRole('host');
    router.replace('/(tabs)');
  };

  const handleJoinLocal = () => {
    setRole(selectedRole);
    connectToHost({
      host: '127.0.0.1',
      port: serverPort,
      role: selectedRole,
      name: `Demo ${ROLE_LABELS[selectedRole]}`,
    });
    router.replace('/(tabs)');
  };

  const handleScanQr = () => {
    router.push('/scan-qr');
  };

  const handleEnterManually = () => {
    router.push('/(auth)/role-selection');
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

      {isLocalServerRunning && (
        <Box style={styles.localCard} p={16} gap={12} mb={32}>
          <Box direction="row" align="center" gap={8}>
            <View style={styles.onlineDot} />
            <Text variant="body2" style={styles.onlineText}>
              {getResource('discovery_local_detected')}
            </Text>
          </Box>
          <Text variant="bodyBold">{`127.0.0.1:${serverPort}`}</Text>

          <Box direction="row" gap={8}>
            {CLIENT_ROLES.map(r => (
              <Pressable key={r} onPress={() => setSelectedRole(r)}>
                <Box
                  style={selectedRole === r
                    ? { ...styles.roleChip, ...styles.roleChipSelected }
                    : styles.roleChip
                  }
                  px={12}
                  py={6}
                >
                  <Text
                    variant="body2"
                    style={selectedRole === r ? styles.roleChipTextSelected : styles.roleChipText}
                  >
                    {ROLE_LABELS[r]}
                  </Text>
                </Box>
              </Pressable>
            ))}
          </Box>

          <Button onPress={handleJoinLocal}>
            {getResource('discovery_join_local')}
          </Button>
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
  onlineText: {
    color: Colors.status.online,
  },
  roleChip: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    backgroundColor: Colors.dark.background,
  },
  roleChipSelected: {
    borderColor: Colors.primary.main,
    backgroundColor: Colors.dark.backgroundLight,
  },
  roleChipText: {
    color: Colors.text.secondary,
  },
  roleChipTextSelected: {
    color: Colors.primary.main,
  },
});
