import { ScrollView, StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Ionicons from '@expo/vector-icons/Ionicons';
import Colors from '@constants/Colors';
import { HEADER_HEIGHT } from '@constants/Dimensions';
import { Box, Button, StatusBadge, Text } from '@components';
import { getResource } from '@resources';
import {
  ConnectedClient,
  useJudgingServerStore,
} from '@stores/judgingServer/useJudgingServerStore';
import { useDemoBattleStore } from '@stores/demoBattle/useDemoBattleStore';
import { createQrPayload } from '../../infrastructure/network/connectionAddress';

type InfoCardProps = {
  label: string;
  value: string;
};

const InfoCard: React.FC<InfoCardProps> = ({ label, value }) => (
  <View style={styles.infoCard}>
    <Text variant="body2" color="textSecondary">{label}</Text>
    <Text variant="h2" color="primary">{value}</Text>
  </View>
);

type DeviceListItemProps = {
  client: ConnectedClient;
};

const DeviceListItem: React.FC<DeviceListItemProps> = ({ client }) => {
  const roleLabel =
    client.role === 'judge' ? getResource('role_adjudicator')
    : client.role === 'mc' ? getResource('role_mc')
    : getResource('role_spectator');

  const avatarBg =
    client.role === 'mc' ? Colors.role.mcBackground : Colors.role.judgeBackground;

  const iconName: React.ComponentProps<typeof Ionicons>['name'] =
    client.role === 'mc' ? 'mic-outline' : 'person-outline';

  return (
    <View style={[styles.deviceRow, !client.isOnline && styles.deviceRowOffline]}>
      <Box direction="row" align="center" gap={16}>
        <View style={[styles.avatarCircle, { backgroundColor: avatarBg }]}>
          <Ionicons name={iconName} size={18} color={Colors.text.secondary} />
        </View>
        <Box gap={2}>
          <Text variant="bodyBold">{client.name}</Text>
          <Text variant="body2" color="textSecondary">{roleLabel}</Text>
        </Box>
      </Box>
      <StatusBadge status={client.isOnline ? 'online' : 'offline'} />
    </View>
  );
};

type SpectatorRowProps = {
  count: number;
};

const SpectatorRow: React.FC<SpectatorRowProps> = ({ count }) => (
  <View style={[styles.deviceRow, styles.spectatorRow]}>
    <Box direction="row" align="center" gap={16}>
      <View style={[styles.avatarCircle, { backgroundColor: Colors.dark.backgroundLight }]}>
        <Ionicons name="people-outline" size={18} color={Colors.text.secondary} />
      </View>
      <Box gap={2}>
        <Text variant="bodyBold" color="textSecondary">{getResource('role_spectators')}</Text>
        <Text variant="body2" color="textSecondary">{getResource('judging_live_stream')}</Text>
      </Box>
    </Box>
    <Text variant="h2">{count}</Text>
  </View>
);

const styles = StyleSheet.create({
  scroll: {
    padding: 24,
    paddingTop: HEADER_HEIGHT + 24,
    gap: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: Colors.dark.backgroundLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    padding: 24,
    gap: 24,
  },
  qrContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  qrCard: {
    backgroundColor: Colors.text.primary,
    padding: 24,
    borderRadius: 12,
  },
  qrUnavailable: {
    width: 256,
    height: 256,
  },
  scanBadge: {
    position: 'absolute',
    top: -12,
    right: 0,
    backgroundColor: Colors.primary.main,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  infoCard: {
    backgroundColor: Colors.dark.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    padding: 16,
    gap: 4,
  },
  infoCardWrapper: {
    flex: 1,
  },
  warning: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
    backgroundColor: Colors.warning.background,
    borderWidth: 1,
    borderColor: Colors.warning.border,
    borderRadius: 8,
    padding: 16,
  },
  warningText: {
    flex: 1,
    color: Colors.secondary.light,
  },
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  deviceHeaderLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  deviceList: {
    gap: 12,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.dark.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    padding: 16,
  },
  deviceRowOffline: {
    opacity: 0.6,
  },
  spectatorRow: {
    borderStyle: 'dashed',
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceFooter: {
    borderTopWidth: 1,
    borderTopColor: Colors.border.subtle,
    paddingTop: 16,
  },
});

export const JudgingAdminScreen: React.FC = () => {
  const connectionInfo = useJudgingServerStore((state) => state.connectionInfo);
  const lastError = useJudgingServerStore((state) => state.lastError);
  const serverPort = useJudgingServerStore((state) => state.port);
  const port = connectionInfo?.port ?? serverPort;
  const connectedClients = useJudgingServerStore((state) => state.connectedClients);
  const restartServer = useJudgingServerStore((state) => state.restartServer);
  const event = useDemoBattleStore((state) => state.event);

  const displayHost = connectionInfo?.host ?? '...';
  const qrValue = connectionInfo
    ? createQrPayload(connectionInfo.host, connectionInfo.port)
    : null;
  const onlineCount = connectedClients.filter((c) => c.isOnline).length;
  const namedClients = connectedClients.filter((c) => c.role !== 'spectator');
  const spectatorCount = connectedClients.filter(
    (c) => c.role === 'spectator' && c.isOnline,
  ).length;

  return (
    <Box fullHeight color={Colors.dark.background}>
      <ScrollView contentContainerStyle={styles.scroll}>

        <View style={styles.card}>
          <Box gap={4}>
            <Text variant="h1">{event?.title ?? ''}</Text>
            <Text variant="body" color="textSecondary">
              {getResource('judging_subtitle')}
            </Text>
          </Box>

          <View style={styles.qrContainer}>
            <View style={styles.qrCard}>
              {qrValue ? (
                <QRCode value={qrValue} size={256} backgroundColor={Colors.text.primary} color={Colors.dark.text} />
              ) : (
                <Box style={styles.qrUnavailable} align="center" justify="center">
                  <Text variant="body2" color={Colors.primary.dark} centered>
                    LAN address unavailable
                  </Text>
                </Box>
              )}
            </View>
            <View style={styles.scanBadge}>
              <Text variant="body2" color={Colors.primary.dark}>{getResource('judging_scan_to_join')}</Text>
            </View>
          </View>

          <Box direction="row" gap={16}>
            <View style={styles.infoCardWrapper}>
              <InfoCard label={getResource('judging_ip_address')} value={displayHost} />
            </View>
            <View style={styles.infoCardWrapper}>
              <InfoCard label={getResource('judging_port')} value={String(port)} />
            </View>
          </Box>

          <View style={styles.warning}>
            <Ionicons name="warning-outline" size={22} color={Colors.error.main} />
            <Text variant="body" style={styles.warningText}>
              {getResource('judging_wifi_warning')}
              {lastError ? ` ${lastError}` : ''}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.deviceHeader}>
            <Text variant="bodyBold" style={styles.deviceHeaderLabel}>
              {getResource('judging_connected_devices')}
            </Text>
            <Box direction="row" align="center" gap={8}>
              <Text variant="body2" color="textSecondary">{getResource('judging_total')}</Text>
              <Text variant="h2" color="primary">{onlineCount}</Text>
            </Box>
          </View>

          <View style={styles.deviceList}>
            {namedClients.map((client) => (
              <DeviceListItem key={client.deviceId} client={client} />
            ))}
            {spectatorCount > 0 && <SpectatorRow count={spectatorCount} />}
          </View>

          <View style={styles.deviceFooter}>
            <Button onPress={restartServer}>{getResource('judging_refresh')}</Button>
          </View>
        </View>

      </ScrollView>
    </Box>
  );
};
