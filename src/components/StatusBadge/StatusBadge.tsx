import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../Text';
import Colors from '@constants/Colors';
import { getResource } from '@resources';

type Props = {
  status: 'online' | 'offline';
};

const StatusBadge: React.FC<Props> = ({ status }) => {
  const isOnline = status === 'online';
  const dotColor = isOnline ? Colors.status.online : Colors.text.hint;
  const textColor = isOnline ? Colors.status.online : Colors.text.hint;
  const label = isOnline ? getResource('online') : getResource('offline');

  return (
    <View
      style={[
        styles.container,
        !isOnline && styles.offlineContainer,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Text
        variant="body2"
        color={textColor}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  offlineContainer: {
    opacity: 0.6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export { StatusBadge };
