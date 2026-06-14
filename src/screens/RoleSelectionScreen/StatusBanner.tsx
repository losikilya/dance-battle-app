import React from 'react';
import { StyleSheet, View } from 'react-native';
import Colors from '@constants/Colors';
import { Box, Text } from '@components';
import { getResource } from '@resources';
import { useJudgingServerStore } from '@stores/judgingServer/useJudgingServerStore';
export const StatusBanner: React.FC = () => {
  const status = useJudgingServerStore((s) => s.status);
  const isOnline = status === 'running';

  return (
    <View style={styles.banner}>
      <Box direction="row" align="center" gap={8}>
        <View style={[styles.dot, isOnline ? styles.dotOnline : styles.dotOffline]} />
        <Text variant="body2" color={isOnline ? 'textPrimary' : 'textSecondary'}>
          {isOnline ? getResource('role_selection_status_online') : getResource('offline')}
        </Text>
      </Box>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    borderRadius: 20,
    backgroundColor: Colors.dark.backgroundLight,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotOnline: {
    backgroundColor: Colors.status.online,
  },
  dotOffline: {
    backgroundColor: Colors.text.secondary,
  },
});
