import { useState } from "react";
import { ScrollView, StyleSheet, TextInput } from "react-native";
import { Box, Text, Button } from "@components";
import Colors from "@constants/Colors";
import { HEADER_HEIGHT, FOOTER_HEIGHT } from "@constants/Dimensions";
import { getResource } from "@resources";
import {
  useJudgingClientStore,
  MAX_RECONNECT_ATTEMPTS,
} from "@stores/judgingClient/useJudgingClientStore";
import { useJudgingServerStore } from "@stores/judgingServer/useJudgingServerStore";
import { useSessionStore } from "@stores/session/useSessionStore";
import type { ClientRole } from "@domain/sync/wsProtocol";

export const JudgeConnectScreen: React.FC = () => {
  const status = useJudgingClientStore((s) => s.status);
  const lastError = useJudgingClientStore((s) => s.lastError);
  const reconnectAttempts = useJudgingClientStore((s) => s.reconnectAttempts);
  const serverAddress = useJudgingClientStore((s) => s.serverAddress);
  const pendingAddress = useJudgingClientStore((s) => s.pendingAddress);
  const connectToHost = useJudgingClientStore((s) => s.connectToHost);
  const setPendingAddress = useJudgingClientStore((s) => s.setPendingAddress);

  const serverPort = useJudgingServerStore((s) => s.port);
  const serverStatus = useJudgingServerStore((s) => s.status);

  const sessionRole = useSessionStore((s) => s.role);
  const requestedJudgeId = useSessionStore((s) => s.judgeId);
  const judgeName = useSessionStore((s) => s.judgeName);
  const setJudgeName = useSessionStore((s) => s.setJudgeName);

  const clientRole: ClientRole = (sessionRole as ClientRole) ?? 'judge';

  const [address, setAddress] = useState(pendingAddress ?? serverAddress ?? "");
  const [name, setName] = useState(judgeName ?? "");

  const isBusy = status === "connecting" || status === "reconnecting";
  const canConnect =
    address.trim().length > 0 && name.trim().length > 0 && !isBusy;

  const handleConnect = () => {
    if (!canConnect) return;
    const trimmedAddress = address.trim();
    const separatorIndex = trimmedAddress.lastIndexOf(":");
    const host = trimmedAddress.slice(0, separatorIndex);
    const port = Number(trimmedAddress.slice(separatorIndex + 1));

    setJudgeName(name.trim());
    setPendingAddress(null);
    connectToHost({
      host,
      port,
      role: clientRole,
      name: name.trim(),
      requestedJudgeId: requestedJudgeId ?? undefined,
    });
  };

  const buttonLabel =
    status === "connecting"
      ? getResource("judge_connect_button") + "…"
      : status === "reconnecting"
        ? `${getResource("judge_connect_reconnecting_prefix")} ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}…`
        : getResource("judge_connect_button");

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Box gap={4} mb={32}>
        <Text variant="h1">{getResource("judge_connect_title")}</Text>
        <Text variant="body2" color="textSecondary">
          {getResource("judge_connect_subtitle")}
        </Text>
      </Box>

      {serverStatus === 'running' && (
        <Box style={styles.quickConnect} p={16} gap={12} mb={24}>
          <Box gap={4}>
            <Text variant="body2" color="textSecondary">
              {getResource("judge_connect_local_detected")}
            </Text>
            <Text variant="bodyBold">{`127.0.0.1:${serverPort}`}</Text>
          </Box>
          <Button
            disabled={isBusy}
            onPress={() => {
              setPendingAddress(null);
              connectToHost({
                host: "127.0.0.1",
                port: serverPort,
                role: clientRole,
                name: "Demo Judge",
              });
            }}
          >
            {getResource("judge_connect_local_button")}
          </Button>
        </Box>
      )}

      <Box gap={8} mb={16}>
        <Text variant="body2" color="textSecondary">
          {getResource("judge_connect_address_label")}
        </Text>
        <TextInput
          style={[styles.input, isBusy && styles.inputDisabled]}
          value={address}
          onChangeText={setAddress}
          placeholder="192.168.1.5:8080"
          placeholderTextColor={Colors.text.secondary}
          autoCapitalize="none"
          keyboardType="numbers-and-punctuation"
          editable={!isBusy}
        />
      </Box>

      <Box gap={8} mb={32}>
        <Text variant="body2" color="textSecondary">
          {getResource("judge_connect_name_label")}
        </Text>
        <TextInput
          style={[styles.input, isBusy && styles.inputDisabled]}
          value={name}
          onChangeText={setName}
          placeholder={getResource("judge_connect_name_placeholder")}
          placeholderTextColor={Colors.text.secondary}
          editable={!isBusy}
        />
      </Box>

      <Button disabled={!canConnect} onPress={handleConnect}>
        {buttonLabel}
      </Button>

      {status === "error" && lastError !== null && (
        <Box mt={16} p={12} style={styles.errorCard}>
          <Text variant="body2" style={styles.errorText}>
            {lastError}
          </Text>
        </Box>
      )}
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
  input: {
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    color: Colors.text.primary,
    fontSize: 14,
    backgroundColor: Colors.dark.backgroundLight,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  quickConnect: {
    backgroundColor: Colors.dark.backgroundLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary.main,
  },
  errorCard: {
    backgroundColor: Colors.dark.backgroundLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.text.error,
  },
  errorText: {
    color: Colors.text.error,
  },
});
