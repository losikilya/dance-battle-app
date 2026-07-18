import { StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Box, Text, Button } from '@components';
import Colors from '@constants/Colors';
import { getResource } from '@resources';
import { Battle } from '@domain/battle/types';
import type { BattleVote } from '@domain/battle/types';
import type { Participant } from '@domain/participant/types';
import { useDemoBattleStore } from '@stores/demoBattle/useDemoBattleStore';

type BattleCardProps = {
  battle: Battle;
  isHost: boolean;
  participants: Participant[];
  votes: BattleVote[];
};

type ParticipantVoteRowProps = {
  name: string;
  votes: number;
  isWinner: boolean;
};

const ParticipantVoteRow: React.FC<ParticipantVoteRowProps> = ({ name, votes, isWinner }) => (
  <Box
    direction="row"
    justify="space-between"
    align="center"
    style={isWinner ? styles.winnerRow : undefined}
    px={isWinner ? 8 : 0}
    py={isWinner ? 4 : 0}
  >
    <Text variant="body" color={isWinner ? 'primary' : 'textPrimary'} numberOfLines={1} style={styles.nameText}>{name}</Text>
    <Text variant="bodyBold" color={isWinner ? 'primary' : 'textSecondary'}>{votes}</Text>
  </Box>
);

export const BattleCard: React.FC<BattleCardProps> = ({
  battle,
  isHost,
  participants,
  votes,
}) => {
  const router = useRouter();
  const startBattle = useDemoBattleStore(s => s.startBattle);
  const openBattleVoting = useDemoBattleStore(s => s.openBattleVoting);
  const canStartBattle = useDemoBattleStore(s => s.canStartBattle);
  const canOpenBattleVoting = useDemoBattleStore(s => s.canOpenBattleVoting);
  const submitRandomVotesForBattle = useDemoBattleStore(s => s.submitRandomVotesForBattle);

  const battleVotes = votes.filter(v => v.battleId === battle.id);
  const votesA = battleVotes.filter(v => v.winnerId === battle.participantAId).length;
  const votesB = battleVotes.filter(v => v.winnerId === battle.participantBId).length;
  const nameA =
    participants.find(participant => participant.id === battle.participantAId)
      ?.name ?? 'Unknown';
  const nameB =
    participants.find(participant => participant.id === battle.participantBId)
      ?.name ?? 'Unknown';

  const isFinished = battle.status === 'finished';
  const statusLabel = isFinished
    ? getResource('bracket_status_winner')
    : battle.status === 'pending'
      ? getResource('bracket_status_pending')
      : battle.status === 'voting'
        ? getResource('bracket_status_voting')
        : getResource('bracket_status_live');

  const statusColor = isFinished
    ? Colors.primary.main
    : battle.status === 'pending'
      ? Colors.text.secondary
      : battle.status === 'voting'
        ? Colors.secondary.main
        : Colors.status.online;

  return (
    <TouchableOpacity
      onPress={() => { router.push(`/brackets/result/${battle.id}`); }}
      disabled={!isFinished}
    >
      <Box style={styles.card} p={16} gap={12}>
        <Box direction="row" justify="space-between" align="center">
          <Text variant="bodyBold">{getResource('bracket_battle_prefix')}{battle.slot}</Text>
          <Box
            style={{ ...styles.statusBadge, borderColor: statusColor }}
            px={8}
            py={4}
          >
            <Text variant="body2" style={{ color: statusColor }}>{statusLabel}</Text>
          </Box>
        </Box>
        <ParticipantVoteRow
          name={nameA}
          votes={votesA}
          isWinner={battle.winnerId === battle.participantAId}
        />
        <ParticipantVoteRow
          name={nameB}
          votes={votesB}
          isWinner={battle.winnerId === battle.participantBId}
        />
        {isHost && battle.status === 'pending' && (
          <Button
            disabled={!canStartBattle(battle.id)}
            onPress={() => { void startBattle(battle.id); }}
          >
            {getResource('battle_start_battle')}
          </Button>
        )}
        {isHost && battle.status === 'active' && (
          <Button
            disabled={!canOpenBattleVoting(battle.id)}
            onPress={() => { void openBattleVoting(battle.id); }}
          >
            {getResource('battle_open_voting')}
          </Button>
        )}
        {isHost && !isFinished && (
          <Button
            variant="outlined"
            onPress={() => { void submitRandomVotesForBattle(battle.id); }}
          >
            {getResource('battle_mock_votes')}
          </Button>
        )}
      </Box>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.dark.backgroundLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  statusBadge: {
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  winnerRow: {
    backgroundColor: 'rgba(76,214,255,0.1)',
    borderRadius: 6,
  },
  nameText: {
    flex: 1,
    marginRight: 8,
  },
});
