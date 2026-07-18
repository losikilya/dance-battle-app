import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

import { Box } from "../Box";
import { Text } from "../Text";
import Colors from "@constants/Colors";
import { getResource } from "@resources";
import { useDemoBattleStore } from "@stores/demoBattle/useDemoBattleStore";
import { useSessionStore } from "@stores/session/useSessionStore";
import type { AppRole } from "@domain/role/types";

type AppMenuAction = {
  id: string;
  label: string;
  icon: string;
  onPress: () => void;
  disabled?: boolean;
};

function MenuActionButton({
  action,
  onPress,
}: {
  action: AppMenuAction;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <TouchableOpacity
      style={[styles.menuAction, action.disabled === true && styles.disabled]}
      onPress={onPress}
      disabled={action.disabled}
      accessibilityRole="button"
    >
      <Ionicons
        name={action.icon as keyof typeof Ionicons.glyphMap}
        size={22}
        color={
          action.disabled === true ? Colors.text.secondary : Colors.primary.main
        }
      />
      <Text
        variant="bodyBold"
        color={action.disabled === true ? "textSecondary" : "textPrimary"}
      >
        {action.label}
      </Text>
    </TouchableOpacity>
  );
}

export function AppTopMenu(): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const role = useSessionStore((state) => state.role);
  const roles = useSessionStore((state) => state.roles);
  const setRole = useSessionStore((state) => state.setRole);
  const hasJudgeRole = useSessionStore((state) => state.hasRole("judge"));
  const setActiveViewRole = useSessionStore((state) => state.setActiveViewRole);
  const setSelfJudgeId = useSessionStore((state) => state.setSelfJudgeId);
  const loadHostDemoBattle = useDemoBattleStore(
    (state) => state.loadHostDemoBattle,
  );

  const handleActionPress = (action: AppMenuAction): void => {
    setIsOpen(false);
    action.onPress();
  };

  const handleLoadHostDemoBattle = async (): Promise<void> => {
    const battleConfigurationId = await loadHostDemoBattle();
    const state = useDemoBattleStore.getState();

    setSelfJudgeId(
      hasJudgeRole
        ? (state.judges.find(
            (judge) =>
              judge.deviceId === "demo_host" &&
              judge.battleConfigurationId === battleConfigurationId,
          )?.id ?? null)
        : null,
    );
  };

  const handleExit = (): void => {
    setIsOpen(false);
    setRole(null);
    router.replace("/(auth)/discovery");
  };

  const openHostView = (viewRole: AppRole): void => {
    setActiveViewRole(viewRole);
    router.replace("/(tabs)");
  };

  const hostActions: AppMenuAction[] =
    role === "host"
      ? [
          {
            id: "dashboard",
            label: getResource("host_tabs_dashboard"),
            icon: "grid-outline",
            onPress: () => openHostView("host"),
          },
          {
            id: "create-event",
            label: getResource("create_event_title"),
            icon: "add-circle-outline",
            onPress: () => router.push("/create-event"),
          },
          {
            id: "create-battle",
            label: getResource("dashboard_action_create_battle"),
            icon: "trophy-outline",
            onPress: () => router.push("/configure-battle"),
          },
          {
            id: "demo-battle",
            label: getResource("dashboard_action_load_demo_battle"),
            icon: "albums-outline",
            onPress: () => {
              void handleLoadHostDemoBattle();
            },
          },
          {
            id: "connection-qr",
            label: getResource("dashboard_action_show_qr"),
            icon: "qr-code-outline",
            onPress: () => router.push("/profile/judge"),
          },
        ]
      : [];

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.root,
        {
          paddingTop: insets.top + 8,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setIsOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={getResource("top_menu_open")}
      >
        <Ionicons name="menu-outline" size={24} color={Colors.text.primary} />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={() => setIsOpen(false)} />
          <View
            style={[
              styles.menu,
              {
                paddingTop: insets.top + 16,
                paddingBottom: insets.bottom + 24,
              },
            ]}
          >
            <Box direction="row" align="center" justify="space-between" mb={24}>
              <TouchableOpacity
                onPress={() => setIsOpen(false)}
                accessibilityRole="button"
                accessibilityLabel={getResource("top_menu_close")}
                style={styles.closeButton}
              >
                <Ionicons
                  name="close-outline"
                  size={24}
                  color={Colors.text.primary}
                />
              </TouchableOpacity>
            </Box>

            <ScrollView
              style={styles.menuBody}
              contentContainerStyle={styles.menuBodyContent}
              showsVerticalScrollIndicator={false}
            >
              {hostActions.length > 0 && (
                <Box gap={12}>
                  <Text variant="body2" color="textSecondary">
                    {getResource("top_menu_host_actions")}
                  </Text>
                  {hostActions.map((action) => (
                    <MenuActionButton
                      key={action.id}
                      action={action}
                      onPress={() => handleActionPress(action)}
                    />
                  ))}
                </Box>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.exitButton}
              onPress={handleExit}
              accessibilityRole="button"
            >
              <Ionicons
                name="log-out-outline"
                size={22}
                color={Colors.text.primary}
              />
              <Text variant="bodyBold">{getResource("top_menu_exit")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: "flex-end",
    paddingHorizontal: 24,
  },
  trigger: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    backgroundColor: Colors.dark.backgroundLight,
  },
  modalRoot: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.dark.backgroundOverlay,
  },
  menu: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    paddingHorizontal: 24,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    backgroundColor: Colors.dark.backgroundLight,
  },
  menuBody: {
    flex: 1,
  },
  menuBodyContent: {
    paddingBottom: 24,
  },
  menuAction: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    backgroundColor: Colors.dark.backgroundLight,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  disabled: {
    opacity: 0.4,
  },
  exitButton: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    backgroundColor: Colors.dark.backgroundLight,
  },
});
