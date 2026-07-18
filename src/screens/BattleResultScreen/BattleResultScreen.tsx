import { ScrollView, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Box, Text, Button } from '@components';
import Colors from '@constants/Colors';
import { HEADER_HEIGHT, FOOTER_HEIGHT } from '@constants/Dimensions';
import { getResource } from '@resources';
import { useBattleState } from '@stores/battle/useBattleState';
import { useJudgingServerStore } from '@stores/judgingServer/useJudgingServerStore';
import { useSessionStore } from '@stores/session/useSessionStore';
import { getJudgeDisplayName } from '../../shared/lib/getJudgeDisplayName';
import { DancerCard } from './DancerCard';
import { JudgeVerdictRow } from './JudgeVerdictRow';

export const BattleResultScreen: React.FC = () => {
  const router = useRouter();
  const { battleId } = useLocalSearchParams<{ battleId: string }>();
  const { state, isHost } = useBattleState();
  const role = useSessionStore(s => s.role);
  const selfJudgeId = useSessionStore(s => s.selfJudgeId);
  const broadcastState = useJudgingServerStore(s => s.broadcastState);

  const battles = state?.battles ?? [];
  const judges = state?.judges ?? [];
  const participants = state?.participants ?? [];
  const allVotes = state?.votes ?? [];

  const battle = battles.find(b => b.id === battleId);

  if (battle === undefined || battle.winnerId === undefined) {
    return (
      <Box fullHeight color={Colors.dark.background} align="center" justify="center">
        <Text variant="body2" color="textSecondary">{getResource('result_not_found')}</Text>
      </Box>
    );
  }

  const votes = allVotes.filter(v => v.battleId === battleId);
  const getParticipantName = (id: string) =>
    participants.find(p => p.id === id)?.name ?? 'Unknown';

  const battleParticipantIds = battle.participantIds ?? [
    battle.participantAId,
    battle.participantBId,
  ];
  const winner = participants.find(p => p.id === battle.winnerId);
  const otherParticipants = battleParticipantIds
    .filter((participantId) => participantId !== battle.winnerId)
    .map((participantId) => participants.find(p => p.id === participantId))
    .filter((participant): participant is NonNullable<typeof participant> =>
      participant !== undefined,
    );

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

      {otherParticipants.map((participant) => (
        <Box key={participant.id} mb={16}>
          <DancerCard participant={participant} isWinner={false} />
        </Box>
      ))}

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
              displayName={getJudgeDisplayName({
                judgeId: judge.id,
                judgeName: judge.name,
                role,
                selfJudgeId,
              })}
              vote={vote}
              participantIds={battleParticipantIds}
            />
          );
        })}
      </Box>

      {isHost && (
        <Box gap={12}>
          <Box mb={4}>
            <Text variant="body2" color="textSecondary">
              {getResource('result_host_actions_title')}
            </Text>
          </Box>
          <Button onPress={() => { broadcastState(); Alert.alert('Broadcasted to all clients.'); }}>
            {getResource('result_broadcast')}
          </Button>
          <Button variant="outlined" color="secondary" onPress={() => router.back()}>
            {getResource('result_archive')}
          </Button>
        </Box>
      )}

      {!isHost && (
        <Box gap={12}>
          <Button variant="outlined" color="secondary" onPress={() => router.back()}>
            {getResource('result_archive')}
          </Button>
        </Box>
      )}
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
