import { StyleSheet } from 'react-native';
import { Box, Text } from '@components';
import Colors from '@constants/Colors';
import { getResource } from '@resources';
import { Judge } from '@domain/judge/types';
import { BattleVote } from '@domain/battle/types';

type JudgeVerdictRowProps = {
  judge: Judge;
  displayName?: string;
  vote: BattleVote | null;
  participantIds: string[];
};

export const JudgeVerdictRow: React.FC<JudgeVerdictRowProps> = ({
  judge,
  displayName = judge.name,
  vote,
  participantIds,
}) => {
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map(w => w.charAt(0).toUpperCase())
    .join('');

  const votedParticipantIndex = vote
    ? participantIds.indexOf(vote.winnerId)
    : -1;
  const hasVote = vote !== null;

  return (
    <Box direction="row" align="center" gap={12} py={12} style={styles.row}>
      <Box style={styles.avatar} align="center" justify="center">
        <Text variant="body2" color="textSecondary">{initials}</Text>
      </Box>
      <Box flex={1} gap={2}>
        <Text variant="bodyBold">{displayName}</Text>
        <Text variant="body2" color="textSecondary">
          {judge.role === 'head' ? getResource('result_judge_role_head') : getResource('result_judge_role_standard')}
        </Text>
      </Box>
      {hasVote && (
        <Box
          style={StyleSheet.flatten([
            styles.voteBadge,
            votedParticipantIndex === 0 ? styles.voteA : styles.voteB,
          ])}
          px={12}
          py={6}
        >
          <Text variant="bodyBold" color="dark">
            {votedParticipantIndex >= 0 ? votedParticipantIndex + 1 : '—'}
          </Text>
        </Box>
      )}
    </Box>
  );
};

const styles = StyleSheet.create({
  row: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.backgroundLight,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  voteBadge: {
    borderRadius: 8,
    minWidth: 36,
    alignItems: 'center',
  },
  voteA: {
    backgroundColor: Colors.primary.main,
  },
  voteB: {
    backgroundColor: Colors.secondary.dark,
  },
});
