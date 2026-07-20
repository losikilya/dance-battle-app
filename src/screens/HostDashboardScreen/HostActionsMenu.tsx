import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Box, Text } from '@components';
import Colors from '@constants/Colors';
import { getResource } from '@resources';

export type HostMenuAction = {
  id: string;
  label: string;
  description?: string;
  icon: string;
  onPress: () => void;
  disabled?: boolean;
};

type HostActionsMenuProps = {
  actions: HostMenuAction[];
};

export const HostActionsMenu: React.FC<HostActionsMenuProps> = ({ actions }) => {
  const [isOpen, setIsOpen] = useState(false);
  const insets = useSafeAreaInsets();

  return (
    <>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setIsOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={getResource('dashboard_menu_open')}
      >
        <Ionicons name="menu-outline" size={26} color={Colors.text.primary} />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={() => setIsOpen(false)} />
          <View
            style={[
              styles.menu,
              {
                paddingTop: insets.top + 16,
                paddingBottom: insets.bottom + 24,
              },
            ]}
          >
            <Box direction="row" align="center" justify="space-between" mb={24}>
              <TouchableOpacity
                onPress={() => setIsOpen(false)}
                accessibilityRole="button"
                accessibilityLabel={getResource('dashboard_menu_close')}
                style={styles.closeButton}
              >
                <Ionicons name="close-outline" size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </Box>

            <ScrollView
              style={styles.menuBody}
              contentContainerStyle={styles.menuBodyContent}
              showsVerticalScrollIndicator={false}
            >
              <Box gap={12}>
                <Text variant="body2" color="textSecondary">
                  {getResource('dashboard_menu_title')}
                </Text>
                {actions.map((action) => (
                  <TouchableOpacity
                    key={action.id}
                    style={[
                      styles.menuAction,
                      action.disabled === true && styles.disabled,
                    ]}
                    disabled={action.disabled}
                    onPress={() => {
                      setIsOpen(false);
                      action.onPress();
                    }}
                    accessibilityRole="button"
                  >
                    <Ionicons
                      name={action.icon as keyof typeof Ionicons.glyphMap}
                      size={22}
                      color={
                        action.disabled === true
                          ? Colors.text.secondary
                          : Colors.primary.main
                      }
                    />
                    <Box style={styles.actionText} gap={4}>
                      <Text
                        variant="bodyBold"
                        color={
                          action.disabled === true
                            ? 'textSecondary'
                            : 'textPrimary'
                        }
                      >
                        {action.label}
                      </Text>
                      {action.description ? (
                        <Text variant="body2" color="textSecondary">
                          {action.description}
                        </Text>
                      ) : null}
                    </Box>
                  </TouchableOpacity>
                ))}
              </Box>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  trigger: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    backgroundColor: Colors.dark.backgroundLight,
  },
  modalRoot: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.dark.backgroundOverlay,
  },
  menu: {
    flex: 1,
    paddingHorizontal: 24,
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
  menuBody: {
    flex: 1,
  },
  menuBodyContent: {
    paddingBottom: 24,
  },
  menuAction: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    backgroundColor: Colors.dark.backgroundLight,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  disabled: {
    opacity: 0.4,
  },
  actionText: {
    flex: 1,
  },
});
