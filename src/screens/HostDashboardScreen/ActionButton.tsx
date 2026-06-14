import { StyleSheet, TouchableOpacity } from 'react-native';
import { Box, Text } from '@components';
import Ionicons from '@expo/vector-icons/Ionicons';
import Colors from '@constants/Colors';

type ActionButtonProps = {
  label: string;
  icon: string;
  onPress: () => void;
  disabled?: boolean;
};

export const ActionButton: React.FC<ActionButtonProps> = ({ label, icon, onPress, disabled }) => (
  <TouchableOpacity onPress={onPress} disabled={disabled} style={[styles.button, disabled === true && styles.disabled]}>
    <Box direction="row" align="center" gap={12}>
      <Ionicons name={icon as any} size={20} color={disabled === true ? Colors.text.secondary : Colors.primary.main} />
      <Text variant="bodyBold" color={disabled === true ? 'textSecondary' : 'textPrimary'}>{label}</Text>
    </Box>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.dark.backgroundLight,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  disabled: {
    opacity: 0.4,
  },
});
