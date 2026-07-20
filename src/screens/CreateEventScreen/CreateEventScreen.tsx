import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Box, Text, Button } from '@components';
import Colors from '@constants/Colors';
import { HEADER_HEIGHT, FOOTER_HEIGHT } from '@constants/Dimensions';
import { getResource } from '@resources';
import type { AppRole } from '@domain/role/types';
import { useDemoBattleStore } from '@stores/demoBattle/useDemoBattleStore';
import { useSessionStore } from '@stores/session/useSessionStore';

export function CreateEventScreen(): React.JSX.Element {
  const router = useRouter();
  const createEvent = useDemoBattleStore((state) => state.createEvent);
  const event = useDemoBattleStore((state) => state.event);
  const sessionRoles = useSessionStore((state) => state.roles);
  const setRole = useSessionStore((state) => state.setRole);
  const setRoles = useSessionStore((state) => state.setRoles);
  const [title, setTitle] = useState('');
  const [selfRunRoles, setSelfRunRoles] = useState<AppRole[]>([
    'host',
    'spectator',
    ...sessionRoles.filter((role) => role === 'mc' || role === 'judge'),
  ]);
  const canSubmit = title.trim().length > 0;

  const toggleSelfRunRole = (role: 'mc' | 'judge'): void => {
    setSelfRunRoles((current) =>
      current.includes(role)
        ? current.filter((item) => item !== role)
        : [...current, role],
    );
  };

  const createCurrentEvent = async (): Promise<boolean> => {
    if (!canSubmit) return false;

    const created = await createEvent({
      title: title.trim(),
    });

    if (created) {
      setRole('host');
      setRoles(selfRunRoles);
    }

    return created;
  };

  const handleSubmit = async (): Promise<void> => {
    if (!canSubmit) return;

    router.push({
      pathname: '/configure-battle',
      params: {
        eventTitle: title.trim(),
        selfRunRoles: JSON.stringify(selfRunRoles),
      },
    });
  };

  const handleFinish = async (): Promise<void> => {
    const created = await createCurrentEvent();

    if (created) {
      router.replace('/(tabs)');
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Box direction="row" align="center" justify="space-between" mb={24}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text variant="bodyBold">{getResource('create_event_title')}</Text>
        <Box style={styles.placeholder} />
      </Box>

      <Box gap={8} mb={20}>
        <Text variant="body2" color="textSecondary">
          {getResource('create_event_name_label')}
        </Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder={getResource('create_event_name_placeholder')}
          placeholderTextColor={Colors.text.secondary}
        />
      </Box>

      <Box gap={12} mb={24}>
        <Text variant="body2" color="textSecondary">
          {getResource('create_event_self_run_roles')}
        </Text>
        {(['mc', 'judge'] as const).map((role) => (
          <TouchableOpacity
            key={role}
            style={styles.roleOption}
            onPress={() => toggleSelfRunRole(role)}
          >
            <Ionicons
              name={selfRunRoles.includes(role) ? 'checkbox' : 'square-outline'}
              size={22}
              color={
                selfRunRoles.includes(role)
                  ? Colors.primary.main
                  : Colors.text.secondary
              }
            />
            <Text variant="bodyBold">
              {getResource(
                role === 'mc'
                  ? 'configure_battle_role_mc'
                  : 'configure_battle_role_judge',
              )}
            </Text>
          </TouchableOpacity>
        ))}
      </Box>

      <Button onPress={handleSubmit} disabled={!canSubmit}>
        {getResource('create_event_continue')}
      </Button>

      <Button
        variant="outlined"
        color="secondary"
        onPress={handleFinish}
        disabled={!canSubmit}
        style={styles.secondaryButton}
      >
        {getResource('create_event_finish')}
      </Button>
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
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  secondaryButton: {
    marginTop: 12,
  },
});
