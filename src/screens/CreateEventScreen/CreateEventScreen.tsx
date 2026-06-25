import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Box, Text, Button, CardSelect, RangeSlider } from '@components';
import Colors from '@constants/Colors';
import { HEADER_HEIGHT, FOOTER_HEIGHT } from '@constants/Dimensions';
import { getResource } from '@resources';
import { useDemoBattleStore } from '@stores/demoBattle/useDemoBattleStore';
import { BattleFormat } from '@domain/event/types';
import type { AppRole } from '@domain/role/types';
import { useSessionStore } from '@stores/session/useSessionStore';
import Ionicons from '@expo/vector-icons/Ionicons';

type SelfRunRoleOption = {
  role: AppRole;
  label: string;
  disabled: boolean;
};

const SELF_RUN_ROLE_OPTIONS: SelfRunRoleOption[] = [
  { role: 'host', label: 'HOST / ORGANIZER', disabled: true },
  { role: 'spectator', label: 'SPECTATOR', disabled: true },
  { role: 'mc', label: 'MC / PRESENTER', disabled: false },
  { role: 'judge', label: 'JUDGE', disabled: false },
];

export function CreateEventScreen() {
  const router = useRouter();
  const createEvent = useDemoBattleStore(s => s.createEvent);
  const sessionRoles = useSessionStore(s => s.roles);
  const setRole = useSessionStore(s => s.setRole);
  const setRoles = useSessionStore(s => s.setRoles);
  const setSelfJudgeId = useSessionStore(s => s.setSelfJudgeId);

  const [title, setTitle] = useState('');
  const [categoryTitle, setCategoryTitle] = useState('');
  const [format, setFormat] = useState<BattleFormat>('top8');
  const [judgesCount, setJudgesCount] = useState('1');
  const [selfRunRoles, setSelfRunRoles] = useState<AppRole[]>([
    'host',
    'spectator',
    ...sessionRoles.filter(role => role === 'mc' || role === 'judge'),
  ]);

  const canSubmit = title.trim().length > 0 && categoryTitle.trim().length > 0;

  const toggleSelfRunRole = (role: AppRole) => {
    if (role === 'host' || role === 'spectator') {
      return;
    }

    setSelfRunRoles(current =>
      current.includes(role)
        ? current.filter(item => item !== role)
        : [...current, role],
    );
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    const firstJudgeId = await createEvent({
      title: title.trim(),
      categoryTitle: categoryTitle.trim(),
      format,
      judgesCount: parseInt(judgesCount, 10),
    });

    setRole('host');
    setRoles(selfRunRoles);
    setSelfJudgeId(
      selfRunRoles.includes('judge') ? firstJudgeId : null,
    );
    router.replace('/(tabs)');
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
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
        <Text variant="body2" color="textSecondary">{getResource('create_event_name_label')}</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Urban Clash 2026"
          placeholderTextColor={Colors.text.secondary}
        />
      </Box>

      <Box gap={8} mb={8}>
        <Text variant="body2" color="textSecondary">{getResource('create_event_category_label')}</Text>
        <TextInput
          style={styles.input}
          value={categoryTitle}
          onChangeText={setCategoryTitle}
          placeholder="Hip-Hop 1x1"
          placeholderTextColor={Colors.text.secondary}
        />
      </Box>

      <CardSelect
        label={getResource('create_event_format_label')}
        value={format}
        onChange={(v) => setFormat(v as BattleFormat)}
        options={[
          { label: 'TOP 8', value: 'top8' },
          { label: 'TOP 16', value: 'top16' },
          { label: 'TOP 32', value: 'top32' },
        ]}
      />

      <CardSelect
        label={getResource('create_event_judges_label')}
        value={judgesCount}
        onChange={setJudgesCount}
        options={[
          { label: '1', value: '1' },
          { label: '3', value: '3' },
          { label: '5', value: '5' },
        ]}
      />

      <Box mt={32} mb={32}>
        <RangeSlider label="QUALITY SCORE RANGE" />
      </Box>

      <Box gap={12} mb={32}>
        <Text variant="body2" color="textSecondary">
          {getResource('create_event_self_run_roles')}
        </Text>
        {SELF_RUN_ROLE_OPTIONS.map(option => {
          const checked = selfRunRoles.includes(option.role);

          return (
            <TouchableOpacity
              key={option.role}
              disabled={option.disabled}
              onPress={() => toggleSelfRunRole(option.role)}
              style={[
                styles.roleOption,
                option.disabled && styles.roleOptionDisabled,
              ]}
            >
              <Ionicons
                name={checked ? 'checkbox' : 'square-outline'}
                size={22}
                color={
                  checked ? Colors.primary.main : Colors.text.secondary
                }
              />
              <Text
                variant="bodyBold"
                color={option.disabled ? 'textSecondary' : 'textPrimary'}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </Box>

      <Button
        disabled={!canSubmit}
        onPress={() => {
          void handleSubmit();
        }}
      >
        {getResource('create_event_submit')}
      </Button>
    </ScrollView>
  );
}

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
  placeholder: {
    width: 24,
    height: 24,
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
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    backgroundColor: Colors.dark.backgroundLight,
  },
  roleOptionDisabled: {
    opacity: 0.7,
  },
});
