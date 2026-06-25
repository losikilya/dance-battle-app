import { ScrollView, StyleSheet } from 'react-native';
import { Box, Text } from '@components';
import Colors from '@constants/Colors';
import { FOOTER_HEIGHT } from '@constants/Dimensions';
import { useDemoBattleStore } from '@stores/demoBattle/useDemoBattleStore';
import { BattleDuelCard } from '@screens/SpectatorLiveScreen/BattleDuelCard';
import { LiveScoreBar } from '@screens/SpectatorLiveScreen/LiveScoreBar';

export const HostLocalSpectatorView: React.FC = () => {
  const event = useDemoBattleStore(state => state.event);
  const participants = useDemoBattleStore(state => state.participants);
  const battles = useDemoBattleStore(state => state.battles);
  const votes = useDemoBattleStore(state => state.votes);
  const activeBattleId = useDemoBattleStore(state => state.activeBattleId);
  const getChampionId = useDemoBattleStore(state => state.getChampionId);

  const activeBattle =
    battles.find(battle => battle.id === activeBattleId) ?? null;
  const participantA = participants.find(
    item => item.id === activeBattle?.participantAId,
  );
  const participantB = participants.find(
    item => item.id === activeBattle?.participantBId,
  );
  const battleVotes = votes.filter(vote => vote.battleId === activeBattleId);
  const votesA = battleVotes.filter(
    vote => vote.winnerId === activeBattle?.participantAId,
  ).length;
  const votesB = battleVotes.filter(
    vote => vote.winnerId === activeBattle?.participantBId,
  ).length;
  const maxVotes = Math.max(votesA, votesB, 1);
  const championId = getChampionId();
  const champion = participants.find(item => item.id === championId);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Box gap={4} mb={24}>
        <Text variant="body2" color="primary">LOCAL SPECTATOR VIEW</Text>
        <Text variant="h1">{event.title}</Text>
        <Text variant="body2" color="textSecondary">
          {event.categoryTitle}
        </Text>
      </Box>

      {champion && (
        <Box style={styles.championCard} p={24} gap={4} mb={20}>
          <Text variant="body2" color="textSecondary">CHAMPION</Text>
          <Text variant="h1">{champion.name}</Text>
        </Box>
      )}

      {activeBattle ? (
        <>
          <Box mb={16}>
            <BattleDuelCard
              participantA={participantA}
              participantB={participantB}
              round={activeBattle.round}
            />
          </Box>
          <Box style={styles.card} p={20} gap={12} mb={20}>
            <Text variant="bodyBold">LIVE JUDGING SCORE</Text>
            <LiveScoreBar
              label={participantA?.name ?? 'A'}
              score={votesA}
              fill={votesA / maxVotes}
              color={Colors.primary.main}
            />
            <LiveScoreBar
              label={participantB?.name ?? 'B'}
              score={votesB}
              fill={votesB / maxVotes}
              color={Colors.secondary.main}
            />
          </Box>
        </>
      ) : (
        <Box style={styles.card} p={24} mb={20}>
          <Text variant="body2" color="textSecondary" centered>
            No active battle — stand by.
          </Text>
        </Box>
      )}

      <Box style={styles.card} p={20} gap={10}>
        <Text variant="bodyBold">TOURNAMENT BRACKET</Text>
        {battles.length === 0 ? (
          <Text variant="body2" color="textSecondary">
            Bracket will appear after qualification.
          </Text>
        ) : (
          battles.map(battle => (
            <Box key={battle.id} gap={2}>
              <Text variant="body">
                {participants.find(p => p.id === battle.participantAId)?.name ??
                  'Unknown'}
                {' vs '}
                {participants.find(p => p.id === battle.participantBId)?.name ??
                  'Unknown'}
              </Text>
              <Text variant="body2" color="textSecondary">
                {battle.round.toUpperCase()} · {battle.status.toUpperCase()}
              </Text>
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
  championCard: {
    backgroundColor: Colors.primary.subtle,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary.main,
  },
});
