import { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Alert, TouchableOpacity, TextInput, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Box, Text, Button } from '@components';
import Ionicons from '@expo/vector-icons/Ionicons';
import Colors from '@constants/Colors';
import { HEADER_HEIGHT, FOOTER_HEIGHT } from '@constants/Dimensions';
import { getResource } from '@resources';
import { useDemoBattleStore } from '@stores/demoBattle/useDemoBattleStore';
import { useSessionStore } from '@stores/session/useSessionStore';
import { ParticipantRow } from './ParticipantRow';
import { ParticipantStatsBar } from './ParticipantStatsBar';

const PAGE_SIZE = 20;

export const ParticipantsScreen: React.FC = () => {
  const router = useRouter();
  const role = useSessionStore(s => s.role);
  const participants = useDemoBattleStore(s => s.participants);
  const event = useDemoBattleStore(s => s.event);
  const addParticipant = useDemoBattleStore(s => s.addParticipant);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [addName, setAddName] = useState('');
  const [addNumber, setAddNumber] = useState('');
  const [addCrew, setAddCrew] = useState('');
  const [addCity, setAddCity] = useState('');

  useEffect(() => {
    if (role !== 'host') {
      router.replace('/(auth)/role-selection');
    }
  }, [role, router]);

  const presentCount = participants.filter(p => p.checkIn === 'present').length;
  const checkInPercent = participants.length > 0 ? (presentCount / participants.length) * 100 : 0;

  const filtered = participants.filter(p => {
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
      Alert.alert('Name and number are required.');
      return;
    }
    addParticipant({
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
            {getResource('participants_subtitle_prefix')} {event.title}.
          </Text>
        </Box>

        <Box direction="row" gap={12} mb={24}>
          <Box flex={1}>
            <Button
              variant="outlined"
              color="secondary"
              onPress={() => { Alert.alert('Coming soon'); }}
            >
              {getResource('participants_import_csv')}
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
            <Text variant="bodyBold">{participants.length}</Text>
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
            <Text variant="body2" color="textSecondary" centered>No participants found.</Text>
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
              placeholder="Name *"
              placeholderTextColor={Colors.text.secondary}
            />
            <TextInput
              style={styles.modalInput}
              value={addNumber}
              onChangeText={setAddNumber}
              placeholder="Number *"
              placeholderTextColor={Colors.text.secondary}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.modalInput}
              value={addCrew}
              onChangeText={setAddCrew}
              placeholder="Crew"
              placeholderTextColor={Colors.text.secondary}
            />
            <TextInput
              style={styles.modalInput}
              value={addCity}
              onChangeText={setAddCity}
              placeholder="City"
              placeholderTextColor={Colors.text.secondary}
            />
            <Box direction="row" gap={12}>
              <Box flex={1}>
                <Button variant="outlined" color="secondary" onPress={() => setAddModalVisible(false)}>
                  Cancel
                </Button>
              </Box>
              <Box flex={1}>
                <Button onPress={handleAdd}>Add</Button>
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
