import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Box, Text } from '@components';
import Colors from '@constants/Colors';
import { getResource } from '@resources';

export type RosterListAction = {
  id?: string;
  label: string;
  onPress: () => void;
  active?: boolean;
};

export type RosterListItem = {
  id: string;
  title: string;
  subtitle?: string;
  detail?: string;
  actions?: RosterListAction[];
};

type RosterListModalProps = {
  visible: boolean;
  title: string;
  items: RosterListItem[];
  onClose: () => void;
};

export const RosterListModal: React.FC<RosterListModalProps> = ({
  visible,
  title,
  items,
  onClose,
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onClose}
  >
    <View style={styles.modalRoot}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <Box direction="row" align="center" justify="space-between" mb={18}>
          <Text variant="h2">{title}</Text>
          <TouchableOpacity
            style={styles.closeButton}
            accessibilityRole="button"
            accessibilityLabel={getResource('dashboard_list_close')}
            onPress={onClose}
          >
            <Ionicons name="close-outline" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
        </Box>

        <ScrollView showsVerticalScrollIndicator={false}>
          <Box gap={12}>
            {items.length === 0 ? (
              <Box style={styles.emptyCard} p={16}>
                <Text variant="body2" color="textSecondary">
                  {getResource('dashboard_list_empty')}
                </Text>
              </Box>
            ) : (
              items.map((item) => (
                <Box key={item.id} style={styles.itemCard} p={14} gap={10}>
                  <Box gap={4}>
                    <Text variant="bodyBold">{item.title}</Text>
                    {item.subtitle !== undefined && (
                      <Text variant="body2" color="textSecondary">
                        {item.subtitle}
                      </Text>
                    )}
                    {item.detail !== undefined && (
                      <Text variant="body2" color="textSecondary">
                        {item.detail}
                      </Text>
                    )}
                  </Box>

                  {item.actions !== undefined && item.actions.length > 0 && (
                    <Box direction="row" gap={8} style={styles.actionsRow}>
                      {item.actions.map((action, index) => (
                        <TouchableOpacity
                          key={`${item.id}_${action.id ?? action.label}_${index}`}
                          style={[
                            styles.roleButton,
                            action.active === true && styles.roleButtonActive,
                          ]}
                          accessibilityRole="button"
                          onPress={action.onPress}
                        >
                          <Text variant="body2">{action.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </Box>
                  )}
                </Box>
              ))
            )}
          </Box>
        </ScrollView>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.dark.backgroundOverlay,
  },
  sheet: {
    maxHeight: '84%',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    backgroundColor: Colors.dark.background,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    backgroundColor: Colors.dark.backgroundLight,
  },
  emptyCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    backgroundColor: Colors.dark.backgroundLight,
  },
  itemCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    backgroundColor: Colors.dark.backgroundLight,
  },
  roleButton: {
    minWidth: 112,
    flexGrow: 1,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    backgroundColor: Colors.dark.background,
  },
  actionsRow: {
    flexWrap: 'wrap',
  },
  roleButtonActive: {
    borderColor: Colors.primary.main,
    backgroundColor: Colors.primary.dark,
  },
});
