import { ScrollView, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Box, Text, Button } from '@components';
import Colors from '@constants/Colors';
import { HEADER_HEIGHT, FOOTER_HEIGHT } from '@constants/Dimensions';
import { getResource } from '@resources';
import { useDemoBattleStore } from '@stores/demoBattle/useDemoBattleStore';
import { DancerCard } from './DancerCard';
import { JudgeVerdictRow } from './JudgeVerdictRow';

export const BattleResultScreen: React.FC = () => {
  const router = useRouter();
  const { battleId } = useLocalSearchParams<{ battleId: string }>();
  const battles = useDemoBattleStore(s => s.battles);
  const votes = useDemoBattleStore(s => s.getVotesForBattle(battleId ?? ''));
  const judges = useDemoBattleStore(s => s.judges);
  const participants = useDemoBattleStore(s => s.participants);
  const getParticipantName = useDemoBattleStore(s => s.getParticipantName);

  const battle = battles.find(b => b.id === battleId);

  if (battle === undefined || battle.winnerId === undefined) {
    return (
      <Box fullHeight color={Colors.dark.background} align="center" justify="center">
        <Text variant="body2" color="textSecondary">{getResource('result_not_found')}</Text>
      </Box>
    );
  }

  const winner = participants.find(p => p.id === battle.winnerId);
  const loserId = battle.participantAId === battle.winnerId
    ? battle.participantBId
    : battle.participantAId;
  const loser = participants.find(p => p.id === loserId);

  const votesForWinner = votes.filter(v => v.winnerId === battle.winnerId).length;
  const votesForLoser = votes.length - votesForWinner;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Box gap={8} mb={24} align="center">
        <Box direction="row" align="center" gap={8}>
          <Box style={styles.greenDot} />
          <Text variant="bodyBold" color="primary">{getResource('result_complete')}</Text>
        </Box>
        <Text variant="h2">{getResource('result_winner_prefix')} {getParticipantName(battle.winnerId)}</Text>
        <Box style={styles.voteChip} px={20} py={8}>
          <Text variant="h2" color="dark">
            {getResource('result_vote_prefix')} {votesForWinner}-{votesForLoser}
          </Text>
        </Box>
      </Box>

      {winner !== undefined && (
        <Box mb={16}>
          <DancerCard participant={winner} isWinner />
        </Box>
      )}

      {loser !== undefined && (
        <Box mb={24}>
          <DancerCard participant={loser} isWinner={false} />
        </Box>
      )}

      <Box mb={24}>
        <Box mb={8}>
          <Text variant="body2" color="textSecondary">
            {getResource('result_verdict_title')}
          </Text>
        </Box>
        {judges.map(judge => {
          const vote = votes.find(v => v.judgeId === judge.id) ?? null;
          return (
            <JudgeVerdictRow
              key={judge.id}
              judge={judge}
              vote={vote}
              participantAId={battle.participantAId}
            />
          );
        })}
      </Box>

      <Box gap={12}>
        <Box mb={4}>
          <Text variant="body2" color="textSecondary">
            {getResource('result_host_actions_title')}
          </Text>
        </Box>
        <Button onPress={() => { Alert.alert('Broadcasting...'); }}>
          {getResource('result_broadcast')}
        </Button>
        <Button variant="outlined" color="secondary" onPress={() => router.back()}>
          {getResource('result_archive')}
        </Button>
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
  voteChip: {
    backgroundColor: Colors.primary.main,
    borderRadius: 12,
  },
});
