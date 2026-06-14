import React, { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import Colors from "@constants/Colors";
import { Box, Button, Divider, Text } from "@components";
import { getResource } from "@resources";
import { AppRole, ROLE_CONFIG } from "@domain/role/types";
import { useSessionStore } from "@stores/session/useSessionStore";
import { RoleCard } from "./RoleCard";
import { StatusBanner } from "./StatusBanner";

export const RoleSelectionScreen: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<AppRole | null>(null);
  const setRole = useSessionStore((s) => s.setRole);

  const handleConfirm = () => {
    if (!selectedRole) return;
    setRole(selectedRole);
    router.replace("/(tabs)");
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Box mb={24} gap={8}>
        <Text variant="h2" centered>
          {getResource("role_selection_title")}
        </Text>
        <Text variant="body2" color="textSecondary" centered>
          {getResource("role_selection_subtitle")}
        </Text>
      </Box>

      <Box gap={12} mb={24}>
        {ROLE_CONFIG.map((config) => (
          <RoleCard
            key={config.role}
            config={config}
            selected={selectedRole === config.role}
            onPress={() => setSelectedRole(config.role)}
          />
        ))}
      </Box>

      <Divider />

      <Box mt={24} mb={24}>
        <StatusBanner />
      </Box>

      <View style={styles.proSection}>
        <Box gap={8} mb={8}>
          <Text variant="bodyBold">
            {getResource("role_selection_pro_title")}
          </Text>
          <Text variant="body2" color="textSecondary">
            {getResource("role_selection_pro_body")}
          </Text>
        </Box>
        <Text variant="body2" color="primary">
          {getResource("role_selection_pro_link")}
        </Text>
      </View>

      <Box mt={32} mb={24}>
        <Button
          color="primary"
          disabled={selectedRole === null}
          onPress={handleConfirm}
        >
          {getResource("role_selection_confirm")}
        </Button>
      </Box>

      <Box direction="row" justify="space-between" mb={8}>
        <Text variant="body2" color="textSecondary">
          {getResource("role_selection_privacy")}
        </Text>
        <Text variant="body2" color="textSecondary">
          {getResource("role_selection_docs")}
        </Text>
        <Text variant="body2" color="textSecondary">
          {getResource("role_selection_terms")}
        </Text>
      </Box>
      <Box mb={32} align="center">
        <Text variant="body2" color="textSecondary" centered>
          {getResource("role_selection_tagline")}
        </Text>
      </Box>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 40,
  },
  userIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dark.backgroundLight,
    alignItems: "center",
    justifyContent: "center",
  },
  proSection: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    backgroundColor: Colors.dark.backgroundLight,
    padding: 20,
  },
});
