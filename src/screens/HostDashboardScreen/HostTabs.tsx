import { StyleSheet, TouchableOpacity } from 'react-native';
import { usePathname, useRouter } from 'expo-router';

import { Box, Text } from '@components';
import Colors from '@constants/Colors';
import { getResource } from '@resources';

const HOST_TABS = [
  {
    href: '/(tabs)',
    matchPath: '/(tabs)',
    label: getResource('host_tabs_dashboard'),
  },
  {
    href: '/(tabs)/host-battles',
    matchPath: '/(tabs)/host-battles',
    label: getResource('host_tabs_battles'),
  },
] as const;

export function HostTabs(): React.JSX.Element {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <Box direction="row" style={styles.root}>
      {HOST_TABS.map((tab) => {
        const isActive = pathname === tab.matchPath ||
          (tab.matchPath === '/(tabs)' && pathname === '/');

        return (
          <TouchableOpacity
            key={tab.href}
            style={[styles.tab, isActive && styles.activeTab]}
            onPress={() => router.push(tab.href)}
            accessibilityRole="button"
          >
            <Text
              variant="body2"
              color={isActive ? 'textPrimary' : 'textSecondary'}
              centered
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </Box>
  );
}

const styles = StyleSheet.create({
  root: {
    padding: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    backgroundColor: Colors.dark.backgroundLight,
  },
  tab: {
    flex: 1,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  activeTab: {
    backgroundColor: Colors.dark.background,
  },
});
