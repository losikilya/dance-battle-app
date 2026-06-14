import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Box, Text } from '@components';
import Colors from '@constants/Colors';
import { Participant } from '@domain/participant/types';

type DancerVoteCardProps = {
  participant: Participant;
  label: string;
  accentColor: string;
  isSelected: boolean;
  onPress: () => void;
  disabled?: boolean;
  categoryTitle: string;
};

export const DancerVoteCard: React.FC<DancerVoteCardProps> = ({
  participant, label, accentColor, isSelected, onPress, disabled, categoryTitle,
}) => (
  <TouchableOpacity onPress={onPress} disabled={disabled} activeOpacity={0.85}>
    <Box style={StyleSheet.flatten([styles.card, isSelected ? { borderColor: accentColor, borderWidth: 2 } : undefined])} gap={0}>
      <View style={styles.photoContainer}>
        <View style={styles.photo} />
        <View style={styles.overlay} />
        <Box px={10} py={4} style={StyleSheet.flatten([styles.badge, { backgroundColor: accentColor }])}>
          <Text variant="body2" color="dark">{label}</Text>
        </Box>
        <Text variant="h1" style={styles.nameOverlay}>{participant.name}</Text>
      </View>
      <Box direction="row" px={16} py={12} gap={24}>
        <Box flex={1}>
          <Text variant="body2" color="textSecondary">ORIGIN</Text>
          <Text variant="bodyBold" numberOfLines={1}>{participant.city ?? '—'}</Text>
        </Box>
        <Box flex={1}>
          <Text variant="body2" color="textSecondary">STYLE</Text>
          <Text variant="bodyBold" numberOfLines={1}>{categoryTitle}</Text>
        </Box>
      </Box>
    </Box>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.dark.backgroundLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    overflow: 'hidden',
  },
  photoContainer: {
    height: 220,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.dark.background,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: Colors.dark.backgroundOverlay,
  },
  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
    borderRadius: 6,
  },
  nameOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
    color: Colors.text.primary,
  },
});
