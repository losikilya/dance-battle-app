import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Box, Text, Button, CardSelect, RangeSlider } from '@components';
import Colors from '@constants/Colors';
import { HEADER_HEIGHT, FOOTER_HEIGHT } from '@constants/Dimensions';
import { getResource } from '@resources';
import { useDemoBattleStore } from '@stores/demoBattle/useDemoBattleStore';
import { BattleFormat } from '@domain/event/types';
import Ionicons from '@expo/vector-icons/Ionicons';

export function CreateEventScreen() {
  const router = useRouter();
  const createEvent = useDemoBattleStore(s => s.createEvent);

  const [title, setTitle] = useState('');
  const [categoryTitle, setCategoryTitle] = useState('');
  const [format, setFormat] = useState<BattleFormat>('top8');
  const [judgesCount, setJudgesCount] = useState('3');

  const canSubmit = title.trim().length > 0 && categoryTitle.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    createEvent({
      title: title.trim(),
      categoryTitle: categoryTitle.trim(),
      format,
      judgesCount: parseInt(judgesCount, 10),
    });
    router.replace('/(tabs)');
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Box direction="row" align="center" justify="space-between" mb={24}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text variant="bodyBold">{getResource('create_event_title')}</Text>
        <Box style={styles.placeholder} />
      </Box>

      <Box gap={8} mb={20}>
        <Text variant="body2" color="textSecondary">{getResource('create_event_name_label')}</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Urban Clash 2026"
          placeholderTextColor={Colors.text.secondary}
        />
      </Box>

      <Box gap={8} mb={8}>
        <Text variant="body2" color="textSecondary">{getResource('create_event_category_label')}</Text>
        <TextInput
          style={styles.input}
          value={categoryTitle}
          onChangeText={setCategoryTitle}
          placeholder="Hip-Hop 1x1"
          placeholderTextColor={Colors.text.secondary}
        />
      </Box>

      <CardSelect
        label={getResource('create_event_format_label')}
        value={format}
        onChange={(v) => setFormat(v as BattleFormat)}
        options={[
          { label: 'TOP 8', value: 'top8' },
          { label: 'TOP 16', value: 'top16' },
          { label: 'TOP 32', value: 'top32' },
        ]}
      />

      <CardSelect
        label={getResource('create_event_judges_label')}
        value={judgesCount}
        onChange={setJudgesCount}
        options={[
          { label: '3', value: '3' },
          { label: '5', value: '5' },
          { label: '7', value: '7' },
        ]}
      />

      <Box mt={32} mb={32}>
        <RangeSlider label="QUALITY SCORE RANGE" />
      </Box>

      <Button disabled={!canSubmit} onPress={handleSubmit}>
        {getResource('create_event_submit')}
      </Button>
    </ScrollView>
  );
}

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
  placeholder: {
    width: 24,
    height: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    color: Colors.text.primary,
    fontSize: 14,
    backgroundColor: Colors.dark.backgroundLight,
  },
});
