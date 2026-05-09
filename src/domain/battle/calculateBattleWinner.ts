import { BattleVote } from './types';

type CalculateBattleWinnerParams = {
  votes: BattleVote[];
  judgesCount: number;
};

export function calculateBattleWinner({
  votes,
  judgesCount,
}: CalculateBattleWinnerParams): string | null {
  const votesToWin = Math.floor(judgesCount / 2) + 1;

  const votesByParticipant = votes.reduce<Record<string, number>>(
    (acc, vote) => {
      acc[vote.winnerId] = (acc[vote.winnerId] ?? 0) + 1;
      return acc;
    },
    {},
  );

  const winnerEntry = Object.entries(votesByParticipant).find(
    ([, votesCount]) => votesCount >= votesToWin,
  );

  return winnerEntry?.[0] ?? null;
}