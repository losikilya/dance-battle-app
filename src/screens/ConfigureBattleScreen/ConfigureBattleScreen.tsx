import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Box, Text, Button, CardSelect } from '@components';
import Colors from '@constants/Colors';
import { HEADER_HEIGHT, FOOTER_HEIGHT } from '@constants/Dimensions';
import { getResource } from '@resources';
import type { QualificationAdvanceMode } from '@domain/qualification/types';
import type { AppRole } from '@domain/role/types';
import { useDemoBattleStore } from '@stores/demoBattle/useDemoBattleStore';
import { useSessionStore } from '@stores/session/useSessionStore';

function parsePendingSelfRunRoles(value: string | string[] | undefined): AppRole[] | null {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;

    if (!Array.isArray(parsed)) {
      return null;
    }

    const roles = parsed.filter(
      (role): role is AppRole =>
        role === 'host' ||
        role === 'judge' ||
        role === 'mc' ||
        role === 'spectator',
    );

    return roles.includes('host') ? roles : ['host', 'spectator', ...roles];
  } catch {
    return null;
  }
}

export function ConfigureBattleScreen(): React.JSX.Element {
  const router = useRouter();
  const params = useLocalSearchParams<{
    eventTitle?: string;
    selfRunRoles?: string;
  }>();
  const pendingEventTitle = Array.isArray(params.eventTitle)
    ? params.eventTitle[0]
    : params.eventTitle;
  const pendingSelfRunRoles = parsePendingSelfRunRoles(params.selfRunRoles);
  const hasPendingEvent = typeof pendingEventTitle === 'string' &&
    pendingEventTitle.trim().length > 0;
  const createEvent = useDemoBattleStore((state) => state.createEvent);
  const configureBattle = useDemoBattleStore((state) => state.configureBattle);
  const assignBattleJudge = useDemoBattleStore((state) => state.assignBattleJudge);
  const setRole = useSessionStore((state) => state.setRole);
  const sessionRoles = useSessionStore((state) => state.roles);
  const setRoles = useSessionStore((state) => state.setRoles);
  const setSelfJudgeId = useSessionStore((state) => state.setSelfJudgeId);
  const [categoryTitle, setCategoryTitle] = useState('');
  const [duration, setDuration] = useState('60');
  const [advanceMode, setAdvanceMode] =
    useState<QualificationAdvanceMode>('manual');

  const parsedDuration = Number(duration.trim());
  const isDurationValid = Number.isInteger(parsedDuration) &&
    parsedDuration > 0 && parsedDuration <= 3600;
  const canSubmit = categoryTitle.trim().length > 0 && isDurationValid;

  const handleSubmit = async (): Promise<void> => {
    if (!canSubmit) return;

    const selfRunRoles = pendingSelfRunRoles ?? sessionRoles;

    if (hasPendingEvent) {
      const created = await createEvent({
        title: pendingEventTitle.trim(),
      });

      if (!created) return;

      setRole('host');
      setRoles(selfRunRoles);
    }

    const battleConfigurationId = await configureBattle({
      categoryTitle: categoryTitle.trim(),
      qualificationDurationSeconds: parsedDuration,
      qualificationAdvanceMode: advanceMode,
    });

    if (!battleConfigurationId) return;

    const selfJudgeId = selfRunRoles.includes('judge')
      ? await assignBattleJudge({
          battleConfigurationId,
          deviceId: 'host',
          name: getResource('configure_battle_host_judge_name'),
        })
      : null;

    setRole('host');
    setSelfJudgeId(selfJudgeId);
    router.replace({
      pathname: '/battle-dashboard',
      params: { battleConfigurationId },
    });
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Box direction="row" align="center" justify="space-between" mb={24}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Box style={styles.placeholder} />
        <Box style={styles.placeholder} />
      </Box>

      <Text variant="h1">{getResource('configure_battle_title')}</Text>
      <Text variant="body2" color="textSecondary">
        {getResource('configure_battle_subtitle')}
      </Text>

      <Box mt={24} gap={20}>
        <Box gap={8}>
          <Text variant="body2" color="textSecondary">
            {getResource('create_event_category_label')}
          </Text>
          <TextInput
            style={styles.input}
            value={categoryTitle}
            onChangeText={setCategoryTitle}
            placeholder={getResource('configure_battle_category_placeholder')}
            placeholderTextColor={Colors.text.secondary}
          />
        </Box>
        <Box gap={8}>
          <Text variant="body2" color="textSecondary">
            {getResource('configure_battle_duration_label')}
          </Text>
          <TextInput
            style={[styles.input, !isDurationValid && styles.inputError]}
            value={duration}
            onChangeText={setDuration}
            keyboardType="number-pad"
          />
        </Box>
        <CardSelect
          label={getResource('configure_battle_advance_mode_label')}
          description={getResource('configure_battle_advance_mode_description')}
          value={advanceMode}
          onChange={(value) => setAdvanceMode(value as QualificationAdvanceMode)}
          options={[
            { label: getResource('configure_battle_advance_manual'), value: 'manual' },
            { label: getResource('configure_battle_advance_automatic'), value: 'automatic' },
          ]}
        />
        <Button onPress={handleSubmit} disabled={!canSubmit}>
          {getResource('configure_battle_save')}
        </Button>
      </Box>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.dark.background },
  content: {
    paddingTop: HEADER_HEIGHT + 24,
    paddingBottom: FOOTER_HEIGHT + 24,
    paddingHorizontal: 24,
  },
  placeholder: { width: 24 },
  input: {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    backgroundColor: Colors.dark.backgroundLight,
    color: Colors.text.primary,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  inputError: { borderColor: Colors.error.main },
});
