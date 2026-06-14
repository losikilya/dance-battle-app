import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Colors from '@constants/Colors';
import { Box, Text } from '@components';
import { RoleConfig } from '@domain/role/types';

type Props = {
  config: RoleConfig;
  selected: boolean;
  onPress: () => void;
};

export const RoleCard: React.FC<Props> = ({ config, selected, onPress }) => {
  return (
    <Pressable onPress={onPress}>
      <View style={[styles.card, selected ? styles.cardSelected : styles.cardDefault]}>
        {selected && (
          <View style={styles.checkmark}>
            <MaterialCommunityIcons
              name="check-circle"
              size={20}
              color={Colors.primary.main}
            />
          </View>
        )}
        <View style={styles.iconBox}>
          <MaterialCommunityIcons
            name={config.iconName}
            size={28}
            color={Colors.text.primary}
          />
        </View>
        <Box mt={12} gap={4}>
          <Text variant="bodyBold" color={selected ? 'primary' : 'textPrimary'}>
            {config.title}
          </Text>
          <Text variant="body2" color="textSecondary">
            {config.description}
          </Text>
        </Box>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: Colors.dark.backgroundLight,
    position: 'relative',
  },
  cardDefault: {
    borderColor: Colors.border.subtle,
  },
  cardSelected: {
    borderColor: Colors.primary.light,
    borderWidth: 2,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: Colors.dark.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
});
