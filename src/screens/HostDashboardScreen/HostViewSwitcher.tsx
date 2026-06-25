import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Box, Text } from '@components';
import Colors from '@constants/Colors';
import type { AppRole } from '@domain/role/types';
import { useSessionStore } from '@stores/session/useSessionStore';

const VIEW_OPTIONS: Array<{ role: AppRole; label: string }> = [
  { role: 'host', label: 'HOST CONTROL' },
  { role: 'mc', label: 'MC VIEW' },
  { role: 'judge', label: 'JUDGE VIEW' },
  { role: 'spectator', label: 'SPECTATOR VIEW' },
];

export const HostViewSwitcher: React.FC = () => {
  const roles = useSessionStore(state => state.roles);
  const activeViewRole = useSessionStore(
    state => state.activeViewRole ?? 'host',
  );
  const setActiveViewRole = useSessionStore(
    state => state.setActiveViewRole,
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {VIEW_OPTIONS.map(option => {
        const isActive = activeViewRole === option.role;
        const isEnabled = roles.includes(option.role);

        return (
          <TouchableOpacity
            key={option.role}
            onPress={() => setActiveViewRole(option.role)}
          >
            <Box
              style={StyleSheet.flatten([
                styles.option,
                isActive && styles.optionActive,
              ])}
              px={12}
              py={8}
              direction="row"
              align="center"
              gap={6}
            >
              <Text
                variant="body2"
                color={isActive ? 'primary' : 'textSecondary'}
              >
                {option.label}
              </Text>
              {isEnabled && <Box style={styles.enabledDot} />}
            </Box>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    gap: 8,
  },
  option: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    backgroundColor: Colors.dark.backgroundLight,
  },
  optionActive: {
    borderColor: Colors.primary.main,
  },
  enabledDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.status.online,
  },
});
