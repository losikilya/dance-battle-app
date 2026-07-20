import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
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
  onRename?: (name: string) => void;
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
}) => {
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');

  const startEditing = (item: RosterListItem) => {
    setEditingItemId(item.id);
    setDraftName(item.title);
  };

  const cancelEditing = () => {
    setEditingItemId(null);
    setDraftName('');
  };

  const saveEditing = (item: RosterListItem) => {
    const nextName = draftName.trim();

    if (nextName.length === 0) {
      return;
    }

    item.onRename?.(nextName);
    cancelEditing();
  };

  return (
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

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Box gap={12}>
              {items.length === 0 ? (
                <Box style={styles.emptyCard} p={16}>
                  <Text variant="body2" color="textSecondary">
                    {getResource('dashboard_list_empty')}
                  </Text>
                </Box>
              ) : (
                items.map((item) => {
                  const isEditing = editingItemId === item.id;
                  const canSaveName = draftName.trim().length > 0;

                  return (
                    <Box key={item.id} style={styles.itemCard} p={14} gap={10}>
                      <Box gap={4}>
                        {isEditing ? (
                          <Box gap={8}>
                            <TextInput
                              style={styles.nameInput}
                              value={draftName}
                              onChangeText={setDraftName}
                              placeholder={getResource('dashboard_list_name_placeholder')}
                              placeholderTextColor={Colors.text.secondary}
                              autoCapitalize="words"
                            />
                            <Box direction="row" gap={8} style={styles.actionsRow}>
                              <TouchableOpacity
                                style={[
                                  styles.roleButton,
                                  !canSaveName && styles.roleButtonDisabled,
                                ]}
                                accessibilityRole="button"
                                disabled={!canSaveName}
                                onPress={() => saveEditing(item)}
                              >
                                <Text variant="body2">
                                  {getResource('dashboard_list_rename_save')}
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.roleButton}
                                accessibilityRole="button"
                                onPress={cancelEditing}
                              >
                                <Text variant="body2">
                                  {getResource('dashboard_list_rename_cancel')}
                                </Text>
                              </TouchableOpacity>
                            </Box>
                          </Box>
                        ) : (
                          <Box
                            direction="row"
                            align="center"
                            justify="space-between"
                            gap={10}
                          >
                            <Box flex={1}>
                              <Text variant="bodyBold">{item.title}</Text>
                            </Box>
                            {item.onRename !== undefined && (
                              <TouchableOpacity
                                style={styles.editButton}
                                accessibilityRole="button"
                                accessibilityLabel={getResource('dashboard_list_edit_name')}
                                onPress={() => startEditing(item)}
                              >
                                <Ionicons
                                  name="create-outline"
                                  size={18}
                                  color={Colors.text.primary}
                                />
                              </TouchableOpacity>
                            )}
                          </Box>
                        )}

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
                  );
                })
              )}
            </Box>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

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
  editButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    backgroundColor: Colors.dark.background,
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
  nameInput: {
    minHeight: 42,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: Colors.text.primary,
    fontSize: 14,
    backgroundColor: Colors.dark.background,
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
  roleButtonDisabled: {
    opacity: 0.5,
  },
  actionsRow: {
    flexWrap: 'wrap',
  },
  roleButtonActive: {
    borderColor: Colors.primary.main,
    backgroundColor: Colors.primary.dark,
  },
});
