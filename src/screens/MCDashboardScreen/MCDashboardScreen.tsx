import { useMemo } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Box, Text, Button } from '@components';
import Colors from '@constants/Colors';
import { HEADER_HEIGHT, FOOTER_HEIGHT } from '@constants/Dimensions';
import { getResource } from '@resources';
import { useJudgingClientStore } from '@stores/judgingClient/useJudgingClientStore';
import { useDemoBattleStore } from '@stores/demoBattle/useDemoBattleStore';
import type { RankedParticipant } from '@domain/qualification/types';

const STATUS_LABELS: Record<string, string> = {
  draft: 'DRAFT',
  qualification: 'QUALIFICATION',
  qualification_finished: 'RANKING',
  battle: 'BATTLES',
  finished: 'FINISHED',
};

export const MCDashboardScreen: React.FC = () => {
  const router = useRouter();
  const syncedState = useJudgingClientStore(s => s.syncedState);
  const getRanking = useDemoBattleStore(s => s.getRanking);
  const demoParticipants = useDemoBattleStore(s => s.participants);
  const demoScores = useDemoBattleStore(s => s.scores);
  const ranking = useMemo(() => getRanking(), [getRanking, demoParticipants, demoScores]);

  const participants = syncedState?.participants ?? [];
  const idx = syncedState?.currentQualificationParticipantIndex ?? 0;
  const currentParticipant = participants[idx] ?? null;
  const nextParticipant = participants[idx + 1] ?? null;
  const total = participants.length;
  const progress = total > 0 ? (idx + 1) / total : 0;
  const eventStatus = syncedState?.event.status ?? 'draft';
  const top8 = ranking.slice(0, 8);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Box direction="row" align="center" gap={8} mb={4}>
        <Box style={styles.greenDot} />
        <Text variant="body2" style={styles.liveText}>
          {getResource('mc_live_event')}
        </Text>
      </Box>
      <Box mb={4}>
        <Text variant="body2" color="textSecondary">
          {getResource('mc_stage_prefix')} {STATUS_LABELS[eventStatus] ?? eventStatus}
        </Text>
      </Box>

      <Box direction="row" justify="space-between" align="center" mb={4}>
        <Text variant="body2" color="textSecondary">{getResource('mc_progress_label')}</Text>
        <Text variant="body2" color="textSecondary">{idx + 1} / {total}</Text>
      </Box>
      <Box style={styles.progressTrack} mb={24}>
        <Box style={{ ...styles.progressFill, width: `${progress * 100}%` as `${number}%` }} />
      </Box>

      {currentParticipant !== null && (
        <Box style={styles.heroCard} mb={16}>
          <Box style={styles.photoPlaceholder} align="center" justify="center">
            <Text variant="body2" color="textSecondary">{getResource('mc_photo_placeholder')}</Text>
          </Box>
          <Box p={16} gap={8}>
            <Box style={styles.nowDancingChip} px={12} py={4}>
              <Text variant="body2" style={styles.nowDancingText}>
                {getResource('mc_now_dancing')}
              </Text>
            </Box>
            <Text variant="h1">
              #{String(currentParticipant.number).padStart(2, '0')} {currentParticipant.name}
            </Text>
            <Text variant="body2" color="primary">
              {syncedState?.event.categoryTitle ?? '—'} / {currentParticipant.city}
            </Text>

            <Box direction="row" gap={1} mt={8}>
              <Box style={styles.statBox} align="center" gap={4} flex={1}>
                <Text variant="body2" color="textSecondary">{getResource('mc_remaining')}</Text>
                <Text variant="bodyBold">00:34</Text>
              </Box>
              <Box style={styles.statDivider} />
              <Box style={styles.statBox} align="center" gap={4} flex={1}>
                <Text variant="body2" color="textSecondary">{getResource('mc_stamina')}</Text>
                <Text variant="bodyBold" style={styles.liveText}>92%</Text>
              </Box>
              <Box style={styles.statDivider} />
              <Box style={styles.statBox} align="center" gap={4} flex={1}>
                <Text variant="body2" color="textSecondary">{getResource('mc_bpm')}</Text>
                <Text variant="bodyBold" color="primary">128</Text>
              </Box>
            </Box>
          </Box>
        </Box>
      )}

      {nextParticipant !== null && (
        <Box style={styles.nextUpCard} p={16} gap={12} mb={24}>
          <Box direction="row" align="center" gap={12}>
            <Box style={styles.avatarCircle} align="center" justify="center">
              <Text variant="bodyBold" color="primary">
                {nextParticipant.name.charAt(0).toUpperCase()}
              </Text>
            </Box>
            <Box gap={2}>
              <Text variant="body2" color="textSecondary">
                {getResource('mc_next_up')}
              </Text>
              <Text variant="bodyBold">
                #{String(nextParticipant.number).padStart(2, '0')} {nextParticipant.name}
              </Text>
            </Box>
          </Box>
          <Button variant="outlined" color="secondary" onPress={() => {}}>
            {getResource('mc_prepare_deck')}
          </Button>
        </Box>
      )}

      <Box direction="row" justify="space-between" align="center" mb={12}>
        <Text variant="bodyBold">{getResource('mc_top8_title')}</Text>
      </Box>

      {top8.map((item: RankedParticipant) => {
        const participant = participants.find(p => p.id === item.participantId);
        return (
          <Box key={item.participantId} style={styles.rankRow} px={12} py={10} mb={4} direction="row" align="center" gap={12}>
            <Text variant="bodyBold" color="primary" style={styles.rankNumber}>
              {String(item.rank).padStart(2, '0')}
            </Text>
            <Box flex={1} gap={2}>
              <Text variant="bodyBold">{participant?.name ?? '—'}</Text>
              <Text variant="body2" color="textSecondary">{getResource('mc_tech_art_placeholder')}</Text>
            </Box>
            <Text variant="bodyBold">{item.averageScore.toFixed(1)}</Text>
          </Box>
        );
      })}

      <Box mt={8} align="center">
        <Text
          variant="body2"
          color="primary"
          onPress={() => { router.push('/(tabs)/brackets'); }}
        >
          {getResource('mc_view_archive')}
        </Text>
      </Box>
    </ScrollView>
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
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.status.online,
  },
  liveText: {
    color: Colors.status.online,
  },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.dark.backgroundLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    backgroundColor: Colors.primary.main,
    borderRadius: 2,
  },
  heroCard: {
    backgroundColor: Colors.dark.backgroundLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    overflow: 'hidden',
  },
  photoPlaceholder: {
    width: '100%',
    height: 220,
    backgroundColor: Colors.dark.background,
  },
  nowDancingChip: {
    backgroundColor: Colors.primary.main,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  nowDancingText: {
    color: Colors.dark.background,
    fontWeight: '700',
  },
  statBox: {
    paddingVertical: 8,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border.subtle,
    marginVertical: 8,
  },
  nextUpCard: {
    backgroundColor: Colors.dark.backgroundLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.dark.background,
    borderWidth: 1,
    borderColor: Colors.primary.main,
  },
  rankRow: {
    backgroundColor: Colors.dark.backgroundLight,
    borderRadius: 8,
  },
  rankNumber: {
    width: 28,
  },
});
