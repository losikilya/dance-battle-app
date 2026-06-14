import { StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Box, Text } from '@components';
import Colors from '@constants/Colors';
import { getResource } from '@resources';
import { Battle } from '@domain/battle/types';
import { useDemoBattleStore } from '@stores/demoBattle/useDemoBattleStore';

type BattleCardProps = {
  battle: Battle;
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

export const BattleCard: React.FC<BattleCardProps> = ({ battle }) => {
  const router = useRouter();
  const getParticipantName = useDemoBattleStore(s => s.getParticipantName);
  const getVotesForBattle = useDemoBattleStore(s => s.getVotesForBattle);

  const votes = getVotesForBattle(battle.id);
  const votesA = votes.filter(v => v.winnerId === battle.participantAId).length;
  const votesB = votes.filter(v => v.winnerId === battle.participantBId).length;
  const nameA = getParticipantName(battle.participantAId);
  const nameB = getParticipantName(battle.participantBId);

  const isFinished = battle.status === 'finished';

  const statusLabel = isFinished
    ? getResource('bracket_status_winner')
    : battle.status === 'pending'
      ? getResource('bracket_status_pending')
      : getResource('bracket_status_live');

  const statusColor = isFinished
    ? Colors.primary.main
    : battle.status === 'pending'
      ? Colors.text.secondary
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
