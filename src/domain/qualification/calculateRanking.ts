import { Participant } from '../participant/types';
import { QualificationScore, RankedParticipant } from './types';

type CalculateRankingParams = {
  participants: Participant[];
  scores: QualificationScore[];
};

//todo: tie-break
export function calculateRanking({
  participants,
  scores,
}: CalculateRankingParams): RankedParticipant[] {
  return participants
    .map((participant) => {
      const participantScores = scores.filter(
        (score) => score.participantId === participant.id,
      );

      const totalScore = participantScores.reduce(
        (sum, item) => sum + item.score,
        0,
      );

      const averageScore =
        participantScores.length > 0
          ? totalScore / participantScores.length
          : 0;

      return {
        participantId: participant.id,
        averageScore,
        scoresCount: participantScores.length,
      };
    })
    .sort((a, b) => {
      if (b.averageScore !== a.averageScore) {
        return b.averageScore - a.averageScore;
      }

      return b.scoresCount - a.scoresCount;
    })
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
}