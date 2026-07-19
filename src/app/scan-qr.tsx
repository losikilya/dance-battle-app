import { useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Box, Text, Button } from '@components';
import Colors from '@constants/Colors';
import { getResource } from '@resources';
import { useJudgingClientStore } from '@stores/judgingClient/useJudgingClientStore';
import { useSessionStore } from '@stores/session/useSessionStore';
import { parseQrPayload } from '../infrastructure/network/connectionAddress';

export default function ScanQrScreen(): React.JSX.Element {
  const router = useRouter();
  const setPendingAddress = useJudgingClientStore(s => s.setPendingAddress);
  const connectToHost = useJudgingClientStore(s => s.connectToHost);
  const resetConnectionTarget = useJudgingClientStore(s => s.resetConnectionTarget);
  const connectionStatus = useJudgingClientStore(s => s.status);
  const syncedState = useJudgingClientStore(s => s.syncedState);
  const lastConnectionError = useJudgingClientStore(s => s.lastError);
  const setRole = useSessionStore(s => s.setRole);
  const judgeName = useSessionStore(s => s.judgeName);
  const requestedJudgeId = useSessionStore(s => s.judgeId);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const handleBack = () => {
    router.replace('/(auth)/discovery');
  };

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBack();
      return true;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (connectionStatus === 'connected' && syncedState !== null) {
      router.replace('/(tabs)');
    }
  }, [connectionStatus, router, syncedState]);

  const handleEnterManually = () => {
    setRole('spectator');
    resetConnectionTarget();
    router.replace('/(tabs)/live');
  };

  const handleBarcodeScan = ({ data }: { data: string }) => {
    if (scanned) return;
    const parsedPayload = parseQrPayload(data);

    if (!parsedPayload.ok) {
      setScanError(parsedPayload.error);
      setScanned(true);
      setTimeout(() => {
        setScanned(false);
        setScanError(null);
      }, 2000);
      return;
    }

    setScanned(true);
    setRole('spectator');
    resetConnectionTarget();
    setPendingAddress(null);
    connectToHost({
      host: parsedPayload.value.host,
      port: parsedPayload.value.port,
      role: 'spectator',
      name: judgeName ?? undefined,
      requestedJudgeId: requestedJudgeId ?? undefined,
    });
  };

  const isConnecting =
    connectionStatus === 'connecting' || connectionStatus === 'reconnecting';
  const scanLabel = isConnecting
    ? getResource('scan_qr_connecting')
    : scanError ?? lastConnectionError ?? getResource('scan_qr_label');

  if (!permission) {
    return <Box fullHeight color={Colors.dark.background} />;
  }

  if (!permission.granted) {
    return (
      <Box
        fullHeight
        color={Colors.dark.background}
        align="center"
        justify="center"
        px={24}
        gap={16}
      >
        <Ionicons name="camera-outline" size={64} color={Colors.text.secondary} />
        <Text variant="bodyBold" centered>
          {getResource('scan_qr_permission_title')}
        </Text>
        <Button onPress={requestPermission}>
          {getResource('scan_qr_permission_button')}
        </Button>
        <TouchableOpacity onPress={handleEnterManually}>
          <Text variant="body2" color="textSecondary" centered>
            {getResource('scan_qr_enter_manual')}
          </Text>
        </TouchableOpacity>
      </Box>
    );
  }

  return (
    <Box style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarcodeScan}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />

      <View style={styles.overlay} pointerEvents="box-none">
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>

        <Box style={styles.frameWrapper} align="center" justify="center">
          <Box style={styles.frame} />
          <Box mt={16}>
            <Text variant="body2" style={styles.scanLabel}>
              {scanLabel}
            </Text>
          </Box>
          {isConnecting && (
            <Box mt={12}>
              <ActivityIndicator color={Colors.primary.main} />
            </Box>
          )}
        </Box>

        <Box style={styles.bottomBar} align="center" pb={48}>
          <Button variant="outlined" color="secondary" onPress={handleEnterManually}>
            {getResource('scan_qr_enter_manual')}
          </Button>
        </Box>
      </View>
    </Box>
  );
}

const FRAME_SIZE = 220;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  backButton: {
    position: 'absolute',
    top: 56,
    left: 24,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
  },
  frameWrapper: {
    flex: 1,
  },
  frame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    borderWidth: 2,
    borderColor: Colors.primary.main,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  scanLabel: {
    color: Colors.text.primary,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bottomBar: {
    paddingHorizontal: 24,
  },
});
