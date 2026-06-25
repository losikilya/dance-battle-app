import { ScrollView, StyleSheet } from 'react-native';
import { Box, Text } from '@components';
import Colors from '@constants/Colors';
import { FOOTER_HEIGHT } from '@constants/Dimensions';
import { useDemoBattleStore } from '@stores/demoBattle/useDemoBattleStore';

export const HostLocalMCView: React.FC = () => {
  const event = useDemoBattleStore(state => state.event);
  const participants = useDemoBattleStore(state => state.participants);
  const scores = useDemoBattleStore(state => state.scores);
  const battles = useDemoBattleStore(state => state.battles);
  const activeBattleId = useDemoBattleStore(state => state.activeBattleId);
  const currentIndex = useDemoBattleStore(
    state => state.currentQualificationParticipantIndex,
  );
  const getRanking = useDemoBattleStore(state => state.getRanking);
  const getChampionId = useDemoBattleStore(state => state.getChampionId);

  const currentParticipant = participants[currentIndex] ?? null;
  const nextParticipant = participants[currentIndex + 1] ?? null;
  const activeBattle =
    battles.find(battle => battle.id === activeBattleId) ?? null;
  const ranking = scores.length > 0 ? getRanking().slice(0, 8) : [];
  const championId = getChampionId();
  const champion = participants.find(item => item.id === championId);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Box gap={4} mb={24}>
        <Text variant="body2" color="primary">LOCAL MC VIEW</Text>
        <Text variant="h1">{event.title}</Text>
        <Text variant="body2" color="textSecondary">
          {event.categoryTitle} · {event.status.toUpperCase()}
        </Text>
      </Box>

      {champion && (
        <Box style={styles.highlightCard} p={20} gap={4} mb={20}>
          <Text variant="body2" color="textSecondary">CHAMPION</Text>
          <Text variant="h1">{champion.name}</Text>
        </Box>
      )}

      {activeBattle && (
        <Box style={styles.highlightCard} p={20} gap={8} mb={20}>
          <Text variant="body2" color="primary">CURRENT BATTLE</Text>
          <Text variant="h2">
            {participants.find(item => item.id === activeBattle.participantAId)
              ?.name ?? 'Unknown'}
            {' VS '}
            {participants.find(item => item.id === activeBattle.participantBId)
              ?.name ?? 'Unknown'}
          </Text>
          <Text variant="body2" color="textSecondary">
            {activeBattle.round.toUpperCase()} · {activeBattle.status.toUpperCase()}
          </Text>
        </Box>
      )}

      {event.status === 'qualification' && currentParticipant && (
        <Box style={styles.highlightCard} p={20} gap={8} mb={20}>
          <Text variant="body2" color="primary">NOW DANCING</Text>
          <Text variant="h1">
            #{String(currentParticipant.number).padStart(2, '0')}{' '}
            {currentParticipant.name}
          </Text>
          {nextParticipant && (
            <Text variant="body2" color="textSecondary">
              NEXT: #{String(nextParticipant.number).padStart(2, '0')}{' '}
              {nextParticipant.name}
            </Text>
          )}
        </Box>
      )}

      <Box style={styles.card} p={20} gap={10}>
        <Text variant="bodyBold">TOP 8 RANKING</Text>
        {ranking.length === 0 ? (
          <Text variant="body2" color="textSecondary">
            Ranking will appear after scores are submitted.
          </Text>
        ) : (
          ranking.map(item => (
            <Box
              key={item.participantId}
              direction="row"
              justify="space-between"
            >
              <Text variant="body">
                #{item.rank}{' '}
                {participants.find(p => p.id === item.participantId)?.name ??
                  'Unknown'}
              </Text>
              <Text variant="bodyBold">{item.averageScore.toFixed(1)}</Text>
            </Box>
          ))
        )}
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
    paddingHorizontal: 24,
    paddingBottom: FOOTER_HEIGHT + 24,
  },
  card: {
    backgroundColor: Colors.dark.backgroundLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  highlightCard: {
    backgroundColor: Colors.dark.backgroundLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary.main,
  },
});
