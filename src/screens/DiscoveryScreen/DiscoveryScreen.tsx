import {
  Alert,
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import type { GestureResponderEvent } from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Box, Button, ExternalLink, Text } from "@components";
import Colors from "@constants/Colors";
import { FOOTER_HEIGHT, HEADER_HEIGHT } from "@constants/Dimensions";
import { getResource } from "@resources";
import { useSessionStore } from "@stores/session/useSessionStore";
import { useJudgingServerStore } from "@stores/judgingServer/useJudgingServerStore";
import { useJudgingClientStore } from "@stores/judgingClient/useJudgingClientStore";
import { useDemoBattleStore } from "@stores/demoBattle/useDemoBattleStore";
import type { AppRole } from "@domain/role/types";
import { resetAppSession } from "../../shared/session/resetAppSession";

const PRIVACY_POLICY_URL =
  "https://nickselyakh.github.io/koller-pages/privacy.html";
const SUPPORT_URL = "https://nickselyakh.github.io/koller-pages/support.html";

export const DiscoveryScreen: React.FC = () => {
  const router = useRouter();
  const setRole = useSessionStore((s) => s.setRole);
  const setRoles = useSessionStore((s) => s.setRoles);
  const setSelfJudgeId = useSessionStore((s) => s.setSelfJudgeId);
  const lastHostRoles = useSessionStore((s) => s.lastHostRoles);
  const lastHostSelfJudgeId = useSessionStore((s) => s.lastHostSelfJudgeId);
  const hasCreatedEvent = useDemoBattleStore((s) =>
    s.eventLog.some((appEvent) => appEvent.type === "event.created"),
  );
  const serverStatus = useJudgingServerStore((s) => s.status);
  const connectionInfo = useJudgingServerStore((s) => s.connectionInfo);
  const connectToHost = useJudgingClientStore((s) => s.connectToHost);
  const resetConnectionTarget = useJudgingClientStore(
    (s) => s.resetConnectionTarget,
  );
  const deleteLocalEvent = useDemoBattleStore((s) => s.deleteLocalEvent);
  const localEventTitle = useDemoBattleStore((s) => s.event.title.trim());

  const isLocalServerRunning =
    serverStatus === "running" && connectionInfo !== null;
  const canRestoreStoredOwnEvent = hasCreatedEvent;
  const ownLocalEventRoles: AppRole[] = lastHostRoles.includes("host")
    ? lastHostRoles
    : ["host", "spectator"];
  const canRestoreOwnLocalEvent = canRestoreStoredOwnEvent;
  const canDeleteOwnLocalEvent = canRestoreStoredOwnEvent;
  const localEventDescription = canRestoreStoredOwnEvent
    ? getResource("discovery_local_reconnect")
    : getResource("discovery_local_detected");

  const handleCreateEvent = () => {
    setRole("host");
    router.push("/create-event");
  };

  const handleJoinLocal = () => {
    if (connectionInfo === null) return;
    setRole("spectator");
    connectToHost({
      host: connectionInfo.host,
      port: connectionInfo.port,
      role: "spectator",
      name: `Demo ${getResource("discovery_role_spectator")}`,
    });
    router.replace("/(tabs)");
  };

  const handleConnectToOwnLocalEvent = () => {
    setRole("host");
    setRoles(ownLocalEventRoles);
    setSelfJudgeId(
      ownLocalEventRoles.includes("judge") ? lastHostSelfJudgeId : null,
    );
    router.replace("/(tabs)");
  };

  const handleConnectToLocalEvent = () => {
    if (!isLocalServerRunning || canRestoreStoredOwnEvent) {
      handleConnectToOwnLocalEvent();
      return;
    }

    handleJoinLocal();
  };

  const handleDeleteLocalEvent = () => {
    Alert.alert(
      getResource("discovery_delete_local_title"),
      getResource("discovery_delete_local_message"),
      [
        {
          text: getResource("discovery_delete_local_cancel"),
          style: "cancel",
        },
        {
          text: getResource("discovery_delete_local_confirm"),
          style: "destructive",
          onPress: () => {
            resetAppSession();
            void deleteLocalEvent();
          },
        },
      ],
    );
  };

  const handleDeleteLocalEventPress = (event: GestureResponderEvent) => {
    event.stopPropagation();
    handleDeleteLocalEvent();
  };

  const handleScanQr = () => {
    router.push("/scan-qr");
  };

  return (
    <ImageBackground
      source={require("../../../assets/hero.png")}
      resizeMode="cover"
      style={styles.background}
    >
      <View style={styles.overlay} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Box style={styles.topContent}>
          <Box gap={8} mb={40}>
            <Box direction="row" align="center" gap={12}>
              <Image
                source={require("../../../assets/icon.png")}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text variant="h1" color="primary" style={styles.title}>
                {getResource("discovery_title")}
              </Text>
            </Box>
          </Box>

          {canRestoreOwnLocalEvent && (
            <TouchableOpacity
              style={styles.localCard}
              activeOpacity={0.82}
              accessibilityRole="button"
              onPress={handleConnectToLocalEvent}
            >
              <Box p={16}>
                <Box
                  direction="row"
                  align="flex-start"
                  justify="space-between"
                  gap={12}
                >
                  <Box flex={1} gap={6}>
                    <Box direction="row" align="center" gap={8}>
                      <View style={styles.onlineDot} />
                      <Text variant="bodyBold" numberOfLines={2}>
                        {localEventTitle.length > 0
                          ? localEventTitle
                          : getResource("discovery_local_reconnect")}
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
                      onPress={handleDeleteLocalEventPress}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color={Colors.error.main}
                      />
                    </TouchableOpacity>
                  )}
                </Box>
              </Box>
            </TouchableOpacity>
          )}
        </Box>

        <Box style={styles.bottomContent}>
          <Box gap={12}>
            <Button onPress={handleCreateEvent}>
              {getResource("discovery_create_event")}
            </Button>

            <Button variant="outlined" color="secondary" onPress={handleScanQr}>
              {getResource("discovery_scan_qr")}
            </Button>
          </Box>

          <Box direction="row" justify="center" gap={24} mt={40}>
            <ExternalLink href={PRIVACY_POLICY_URL}>
              <Text variant="body2" color="textSecondary">
                {getResource("discovery_privacy")}
              </Text>
            </ExternalLink>
            <ExternalLink href={SUPPORT_URL}>
              <Text variant="body2" color="textSecondary">
                {getResource("discovery_support")}
              </Text>
            </ExternalLink>
          </Box>
        </Box>
      </ScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.62)",
  },
  scroll: {
    flex: 1,
    backgroundColor: "transparent",
  },
  content: {
    flexGrow: 1,
    justifyContent: "space-between",
    paddingTop: HEADER_HEIGHT + 24,
    paddingBottom: FOOTER_HEIGHT + 24,
    paddingHorizontal: 24,
  },
  topContent: {
    flexShrink: 1,
  },
  bottomContent: {
    paddingTop: 32,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  title: {
    flexShrink: 1,
    letterSpacing: 0,
    textTransform: "none",
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
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    backgroundColor: Colors.dark.background,
  },
});
