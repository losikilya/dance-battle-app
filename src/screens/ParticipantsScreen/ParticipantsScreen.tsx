import { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Alert, TouchableOpacity, TextInput, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { Box, Text, Button } from '@components';
import Ionicons from '@expo/vector-icons/Ionicons';
import Colors from '@constants/Colors';
import { HEADER_HEIGHT, FOOTER_HEIGHT } from '@constants/Dimensions';
import { getResource } from '@resources';
import { useDemoBattleStore } from '@stores/demoBattle/useDemoBattleStore';
import { useSessionStore } from '@stores/session/useSessionStore';
import { parseParticipantsExcel } from '../../infrastructure/import/participantsExcelImport';
import { isInBattleConfiguration } from '@domain/sync/stateSelectors';
import { ParticipantRow } from './ParticipantRow';
import { ParticipantStatsBar } from './ParticipantStatsBar';

const PAGE_SIZE = 20;

export const ParticipantsScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ battleConfigurationId?: string }>();
  const isHost = useSessionStore(s => s.roles.includes('host'));
  const participants = useDemoBattleStore(s => s.participants);
  const event = useDemoBattleStore(s => s.event);
  const addParticipant = useDemoBattleStore(s => s.addParticipant);
  const importParticipants = useDemoBattleStore(s => s.importParticipants);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isImporting, setIsImporting] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [addName, setAddName] = useState('');
  const [addNumber, setAddNumber] = useState('');
  const [addCrew, setAddCrew] = useState('');
  const [addCity, setAddCity] = useState('');

  useEffect(() => {
    if (!isHost) {
      router.replace('/(auth)/discovery');
    }
  }, [isHost, router]);

  const requestedBattleConfigurationId = Array.isArray(params.battleConfigurationId)
    ? params.battleConfigurationId[0]
    : params.battleConfigurationId;
  const activeBattleConfiguration =
    event.battleConfigurations.find(
      (configuration) => configuration.id === requestedBattleConfigurationId,
    ) ?? event.battleConfiguration;
  const activeBattleConfigurationId = activeBattleConfiguration?.id ?? null;
  const battleParticipants = participants.filter(
    (p) => isInBattleConfiguration(activeBattleConfigurationId, p),
  );
  const presentCount = battleParticipants.filter(p => p.checkIn === 'present').length;
  const checkInPercent = battleParticipants.length > 0 ? (presentCount / battleParticipants.length) * 100 : 0;

  const filtered = battleParticipants.filter(p => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.crew?.toLowerCase().includes(q) ?? false) ||
      (p.city?.toLowerCase().includes(q) ?? false) ||
      String(p.number).includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleAdd = () => {
    const number = parseInt(addNumber, 10);
    if (!addName.trim() || isNaN(number)) {
      Alert.alert(getResource('participants_add_required_error'));
      return;
    }
    addParticipant({
      battleConfigurationId: activeBattleConfigurationId ?? undefined,
      name: addName.trim(),
      number,
      crew: addCrew.trim() || undefined,
      city: addCity.trim() || undefined,
    });
    setAddName('');
    setAddNumber('');
    setAddCrew('');
    setAddCity('');
    setAddModalVisible(false);
  };

  const handleImport = async (): Promise<void> => {
    try {
      setIsImporting(true);

      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'text/csv',
        ],
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];

      if (!asset) {
        Alert.alert(getResource('participants_import_error_title'));
        return;
      }

      const response = await fetch(asset.uri);
      const fileData = await response.arrayBuffer();
      const imported = parseParticipantsExcel(fileData);

      if (imported.length === 0) {
        Alert.alert(
          getResource('participants_import_error_title'),
          getResource('participants_import_empty_error'),
        );
        return;
      }

      const importedSuccessfully = await importParticipants(
        imported.map((participant) => ({
          ...participant,
          battleConfigurationId: activeBattleConfigurationId ?? undefined,
        })),
      );

      if (!importedSuccessfully) {
        const error = useDemoBattleStore.getState().lastCommandError;

        Alert.alert(
          getResource('participants_import_error_title'),
          error?.message ?? getResource('participants_import_failed_error'),
        );
        return;
      }

      setPage(1);
      Alert.alert(
        getResource('participants_import_success_title'),
        `${imported.length} ${getResource('participants_import_success_suffix')}`,
      );
    } catch (error) {
      Alert.alert(
        getResource('participants_import_error_title'),
        error instanceof Error
          ? error.message
          : getResource('participants_import_failed_error'),
      );
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Box direction="row" align="center" justify="space-between" mb={8}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text variant="bodyBold">{getResource('participants_title')}</Text>
          <Box style={styles.avatarPlaceholder} />
        </Box>

        <Box mb={20}>
          <Text variant="body2" color="textSecondary">
            {getResource('participants_subtitle_prefix')} {activeBattleConfiguration?.categoryTitle ?? event.title}.
          </Text>
        </Box>

        <Box direction="row" gap={12} mb={24}>
          <Box flex={1}>
            <Button
              variant="outlined"
              color="secondary"
              disabled={isImporting}
              onPress={() => { void handleImport(); }}
            >
              {isImporting
                ? getResource('participants_importing')
                : getResource('participants_import_excel')}
            </Button>
          </Box>
          <Box flex={1}>
            <Button onPress={() => setAddModalVisible(true)}>
              {getResource('participants_add')}
            </Button>
          </Box>
        </Box>

        <Box gap={12} mb={24}>
          <Box style={styles.statCard} p={16} direction="row" justify="space-between" align="center">
            <Text variant="body2" color="textSecondary">{getResource('participants_stat_total')}</Text>
            <Text variant="bodyBold">{battleParticipants.length}</Text>
          </Box>
          <Box style={styles.statCard} p={16} direction="row" justify="space-between" align="center">
            <Text variant="body2" color="textSecondary">{getResource('participants_stat_present')}</Text>
            <Text variant="bodyBold">{presentCount}</Text>
          </Box>
          <Box style={styles.statCard} p={16} gap={8}>
            <Text variant="body2" color="textSecondary">{getResource('participants_stat_checkin')}</Text>
            <ParticipantStatsBar label="" value={checkInPercent} />
          </Box>
        </Box>

        <Box mb={16} style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={(text) => { setSearch(text); setPage(1); }}
            placeholder={getResource('participants_search_placeholder')}
            placeholderTextColor={Colors.text.secondary}
          />
        </Box>

        <Box gap={8} mb={16}>
          {paged.map(p => (
            <ParticipantRow key={p.id} participant={p} />
          ))}
          {paged.length === 0 && (
            <Text variant="body2" color="textSecondary" centered>
              {getResource('participants_empty_search')}
            </Text>
          )}
        </Box>

        {totalPages > 1 && (
          <Box direction="row" justify="center" align="center" gap={16}>
            <TouchableOpacity
              onPress={() => setPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <Ionicons
                name="chevron-back"
                size={20}
                color={currentPage === 1 ? Colors.text.secondary : Colors.text.primary}
              />
            </TouchableOpacity>
            <Text variant="body2" color="textSecondary">
              {currentPage} / {totalPages}
            </Text>
            <TouchableOpacity
              onPress={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <Ionicons
                name="chevron-forward"
                size={20}
                color={currentPage === totalPages ? Colors.text.secondary : Colors.text.primary}
              />
            </TouchableOpacity>
          </Box>
        )}
      </ScrollView>

      <Modal visible={addModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Box style={styles.modalCard} p={24} gap={16}>
            <Text variant="bodyBold">{getResource('participants_add')}</Text>
            <TextInput
              style={styles.modalInput}
              value={addName}
              onChangeText={setAddName}
              placeholder={getResource('participants_name_placeholder')}
              placeholderTextColor={Colors.text.secondary}
            />
            <TextInput
              style={styles.modalInput}
              value={addNumber}
              onChangeText={setAddNumber}
              placeholder={getResource('participants_number_placeholder')}
              placeholderTextColor={Colors.text.secondary}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.modalInput}
              value={addCrew}
              onChangeText={setAddCrew}
              placeholder={getResource('participants_crew_placeholder')}
              placeholderTextColor={Colors.text.secondary}
            />
            <TextInput
              style={styles.modalInput}
              value={addCity}
              onChangeText={setAddCity}
              placeholder={getResource('participants_city_placeholder')}
              placeholderTextColor={Colors.text.secondary}
            />
            <Box direction="row" gap={12}>
              <Box flex={1}>
                <Button variant="outlined" color="secondary" onPress={() => setAddModalVisible(false)}>
                  {getResource('participants_cancel')}
                </Button>
              </Box>
              <Box flex={1}>
                <Button onPress={handleAdd}>
                  {getResource('participants_add_short')}
                </Button>
              </Box>
            </Box>
          </Box>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  content: {
    paddingTop: HEADER_HEIGHT + 24,
    paddingBottom: FOOTER_HEIGHT + 24,
    paddingHorizontal: 24,
  },
  statCard: {
    backgroundColor: Colors.dark.backgroundLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
  },
  searchContainer: {
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    borderRadius: 12,
    backgroundColor: Colors.dark.backgroundLight,
  },
  searchInput: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: Colors.text.primary,
    fontSize: 14,
    fontFamily: 'HauoraRegular',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.dark.backgroundLight,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: Colors.text.primary,
    fontSize: 14,
    fontFamily: 'HauoraRegular',
    backgroundColor: Colors.dark.background,
  },
});
