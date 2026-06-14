import { StyleSheet, TouchableOpacity } from 'react-native';
import { Box, Text } from '@components';
import Ionicons from '@expo/vector-icons/Ionicons';
import Colors from '@constants/Colors';
import { getResource } from '@resources';
import { Participant } from '@domain/participant/types';
import { useDemoBattleStore } from '@stores/demoBattle/useDemoBattleStore';

type ParticipantRowProps = {
  participant: Participant;
};

export const ParticipantRow: React.FC<ParticipantRowProps> = ({ participant }) => {
  const toggleParticipantCheckIn = useDemoBattleStore(s => s.toggleParticipantCheckIn);
  const removeParticipant = useDemoBattleStore(s => s.removeParticipant);

  const isPresent = participant.checkIn === 'present';
  const numberLabel = `#${String(participant.number).padStart(2, '0')}`;

  return (
    <Box style={styles.card} direction="row" align="center" p={16} gap={12}>
      <Box style={styles.numberBadge} px={8} py={4}>
        <Text variant="bodyBold" color="primary">{numberLabel}</Text>
      </Box>
      <Box flex={1} gap={2}>
        <Text variant="bodyBold" numberOfLines={1}>{participant.name}</Text>
        {participant.crew !== undefined && (
          <Text variant="body2" color="textSecondary" numberOfLines={1}>{participant.crew}</Text>
        )}
        {participant.city !== undefined && (
          <Text variant="body2" color="textSecondary" numberOfLines={1}>{participant.city}</Text>
        )}
      </Box>
      <TouchableOpacity onPress={() => toggleParticipantCheckIn(participant.id)}>
        <Box style={isPresent ? { ...styles.statusChip, ...styles.present } : { ...styles.statusChip, ...styles.absent }} px={8} py={4} mr={8}>
          <Text variant="body2" color={isPresent ? 'dark' : 'textSecondary'}>
            {isPresent ? getResource('participants_status_present') : getResource('participants_status_absent')}
          </Text>
        </Box>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => removeParticipant(participant.id)}>
        <Ionicons name="trash-outline" size={18} color={Colors.text.secondary} />
      </TouchableOpacity>
    </Box>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.dark.backgroundLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  numberBadge: {
    backgroundColor: 'rgba(76,214,255,0.15)',
    borderRadius: 8,
  },
  statusChip: {
    borderRadius: 6,
  },
  present: {
    backgroundColor: Colors.status.online,
  },
  absent: {
    backgroundColor: Colors.dark.background,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
});
