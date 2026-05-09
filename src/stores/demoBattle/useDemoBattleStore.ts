import { create } from "zustand";

import {
  createDemoEvent,
  createDemoJudges,
  createDemoParticipants,
} from "../../domain/demo/createDemoEvent";
import { DanceEvent } from "../../domain/event/types";
import { Participant } from "../../domain/participant/types";
import { Judge } from "../../domain/judge/types";
import {
  QualificationScore,
  RankedParticipant,
} from "../../domain/qualification/types";
import { Battle, BattleVote } from "../../domain/battle/types";
import { calculateRanking } from "../../domain/qualification/calculateRanking";
import { generateTop8Bracket } from "../../domain/bracket/generateTop8Bracket";
import { calculateBattleWinner } from "../../domain/battle/calculateBattleWinner";
import {
  generateFinalFromSemifinals,
  generateSemifinalsFromTop8,
} from "../../domain/battle/advanceWinner";
import { createId } from "../../shared/lib/createId";

type SubmitQualificationScoreParams = {
  participantId: string;
  judgeId: string;
  score: number;
};

type SubmitBattleVoteParams = {
  battleId: string;
  judgeId: string;
  winnerId: string;
};

type DemoBattleState = {
  event: DanceEvent;
  participants: Participant[];
  judges: Judge[];
  scores: QualificationScore[];
  battles: Battle[];
  votes: BattleVote[];

  currentQualificationParticipantIndex: number;
  activeBattleId: string | null;
};

type DemoBattleComputed = {
  getRanking: () => RankedParticipant[];
  getParticipantName: (participantId: string) => string;
  getChampionId: () => string | null;

  getCurrentQualificationParticipant: () => Participant | null;
  getScoresForCurrentParticipant: () => QualificationScore[];
  isCurrentParticipantScoredByAllJudges: () => boolean;
  isQualificationFinished: () => boolean;

  getActiveBattle: () => Battle | null;
  getVotesForBattle: (battleId: string) => BattleVote[];
  getJudgeVoteForBattle: (
    battleId: string,
    judgeId: string,
  ) => BattleVote | null;

  canStartQualification: () => boolean;
  canGoToNextQualificationParticipant: () => boolean;
  canFinishQualification: () => boolean;
  canGenerateTop8: () => boolean;
  canStartBattle: (battleId: string) => boolean;
  canSubmitBattleVote: (battleId: string) => boolean;
  canGenerateNextRound: () => boolean;
};

type DemoBattleActions = {
  resetDemo: () => void;

  startQualification: () => void;
  submitQualificationScore: (params: SubmitQualificationScoreParams) => void;
  goToNextQualificationParticipant: () => void;
  finishQualification: () => void;

  fillRandomQualificationScores: () => void;
  generateTop8: () => void;

  startBattle: (battleId: string) => void;
  submitBattleVote: (params: SubmitBattleVoteParams) => void;

  submitRandomVotesForBattle: (battleId: string) => void;
  generateNextRound: () => void;
};

type DemoBattleStore = DemoBattleState & DemoBattleComputed & DemoBattleActions;

function createInitialState(): DemoBattleState {
  return {
    event: createDemoEvent(),
    participants: createDemoParticipants(),
    judges: createDemoJudges(),
    scores: [],
    battles: [],
    votes: [],
    currentQualificationParticipantIndex: 0,
    activeBattleId: null,
  };
}

export const useDemoBattleStore = create<DemoBattleStore>((set, get) => ({
  ...createInitialState(),

  getRanking: () => {
    const { participants, scores } = get();

    return calculateRanking({
      participants,
      scores,
    });
  },

  getParticipantName: (participantId) => {
    const { participants } = get();

    return (
      participants.find((participant) => participant.id === participantId)
        ?.name ?? "Unknown"
    );
  },

  getChampionId: () => {
    const { battles } = get();

    const finalBattle = battles.find(
      (battle) => battle.round === "final" && battle.winnerId,
    );

    return finalBattle?.winnerId ?? null;
  },

  getCurrentQualificationParticipant: () => {
    const { participants, currentQualificationParticipantIndex } = get();

    return participants[currentQualificationParticipantIndex] ?? null;
  },

  getScoresForCurrentParticipant: () => {
    const currentParticipant = get().getCurrentQualificationParticipant();

    if (!currentParticipant) {
      return [];
    }

    return get().scores.filter(
      (score) => score.participantId === currentParticipant.id,
    );
  },

  isCurrentParticipantScoredByAllJudges: () => {
    const currentParticipant = get().getCurrentQualificationParticipant();

    if (!currentParticipant) {
      return false;
    }

    const { scores, judges } = get();

    const currentParticipantScores = scores.filter(
      (score) => score.participantId === currentParticipant.id,
    );

    const uniqueJudgeIds = new Set(
      currentParticipantScores.map((score) => score.judgeId),
    );

    return uniqueJudgeIds.size === judges.length;
  },

  isQualificationFinished: () => {
    const { participants, judges, scores } = get();

    const expectedScoresCount = participants.length * judges.length;

    return scores.length >= expectedScoresCount;
  },

  canStartQualification: () => {
    const { event, participants, judges } = get();

    return (
      event.status === "draft" && participants.length >= 8 && judges.length > 0
    );
  },

  canGoToNextQualificationParticipant: () => {
    const { participants, currentQualificationParticipantIndex } = get();

    const isLastParticipant =
      currentQualificationParticipantIndex >= participants.length - 1;

    return !isLastParticipant && get().isCurrentParticipantScoredByAllJudges();
  },

  canFinishQualification: () => {
    return get().isQualificationFinished();
  },

  canGenerateTop8: () => {
    const { event, participants, judges, scores, battles } = get();

    if (event.status !== "qualification_finished") {
      return false;
    }

    if (battles.length > 0) {
      return false;
    }

    const expectedScoresCount = participants.length * judges.length;

    return scores.length >= expectedScoresCount;
  },

  canGenerateNextRound: () => {
    const { battles } = get();

    const top8Battles = battles.filter((battle) => battle.round === "top8");

    const semifinalBattles = battles.filter(
      (battle) => battle.round === "semifinal",
    );

    const hasSemifinals = semifinalBattles.length > 0;
    const hasFinal = battles.some((battle) => battle.round === "final");

    const top8Finished =
      top8Battles.length === 4 &&
      top8Battles.every((battle) => battle.status === "finished");

    const semifinalsFinished =
      semifinalBattles.length === 2 &&
      semifinalBattles.every((battle) => battle.status === "finished");

    if (top8Finished && !hasSemifinals) {
      return true;
    }

    if (semifinalsFinished && !hasFinal) {
      return true;
    }

    return false;
  },

  resetDemo: () => {
    set(createInitialState());
  },

  startQualification: () => {
    if (!get().canStartQualification()) {
      return;
    }

    set((state) => ({
      event: {
        ...state.event,
        status: "qualification",
      },
      currentQualificationParticipantIndex: 0,
      scores: [],
      battles: [],
      votes: [],
    }));
  },

  submitQualificationScore: ({ participantId, judgeId, score }) => {
    const { event, participants, judges } = get();

    if (event.status !== "qualification") {
      return;
    }

    const participantExists = participants.some(
      (participant) => participant.id === participantId,
    );

    const judgeExists = judges.some((judge) => judge.id === judgeId);

    if (!participantExists || !judgeExists) {
      return;
    }

    if (score < 1 || score > 10) {
      return;
    }

    set((state) => {
      const existingScore = state.scores.find(
        (item) =>
          item.participantId === participantId && item.judgeId === judgeId,
      );

      if (existingScore) {
        return {
          scores: state.scores.map((item) =>
            item.id === existingScore.id
              ? {
                  ...item,
                  score,
                }
              : item,
          ),
        };
      }

      return {
        scores: [
          ...state.scores,
          {
            id: createId("score"),
            participantId,
            judgeId,
            score,
            createdAt: new Date().toISOString(),
          },
        ],
      };
    });
  },

  goToNextQualificationParticipant: () => {
    if (!get().canGoToNextQualificationParticipant()) {
      return;
    }

    set((state) => ({
      currentQualificationParticipantIndex:
        state.currentQualificationParticipantIndex + 1,
    }));
  },

  finishQualification: () => {
    if (!get().canFinishQualification()) {
      return;
    }

    set((state) => ({
      event: {
        ...state.event,
        status: "qualification_finished",
      },
    }));
  },

  fillRandomQualificationScores: () => {
    const { participants, judges } = get();

    const nextScores: QualificationScore[] = [];

    participants.forEach((participant) => {
      judges.forEach((judge) => {
        nextScores.push({
          id: createId("score"),
          participantId: participant.id,
          judgeId: judge.id,
          score: Math.floor(Math.random() * 4) + 7,
          createdAt: new Date().toISOString(),
        });
      });
    });

    set((state) => ({
      event: {
        ...state.event,
        status: "qualification_finished",
      },
      scores: nextScores,
      battles: [],
      votes: [],
      activeBattleId: null,
      currentQualificationParticipantIndex: participants.length - 1,
    }));
  },

  generateTop8: () => {
    if (!get().canGenerateTop8()) {
      return;
    }

    const ranking = get().getRanking();

    const nextBattles = generateTop8Bracket(ranking);

    set((state) => ({
      event: {
        ...state.event,
        status: "battle",
      },
      battles: nextBattles,
      votes: [],
      activeBattleId: null,
    }));
  },

  submitRandomVotesForBattle: (battleId) => {
    const { battles, judges, event } = get();

    if (event.status !== "battle") {
      return;
    }

    const battle = battles.find((item) => item.id === battleId);

    if (!battle) {
      return;
    }

    if (battle.status === "finished") {
      return;
    }

    const battleVotes: BattleVote[] = judges.map((judge) => {
      const winnerId =
        Math.random() > 0.5 ? battle.participantAId : battle.participantBId;

      return {
        id: createId("vote"),
        battleId: battle.id,
        judgeId: judge.id,
        winnerId,
        createdAt: new Date().toISOString(),
      };
    });

    const winnerId = calculateBattleWinner({
      votes: battleVotes,
      judgesCount: judges.length,
    });

    if (!winnerId) {
      return;
    }

    set((state) => ({
      votes: [...state.votes, ...battleVotes],
      battles: state.battles.map((item) =>
        item.id === battle.id
          ? {
              ...item,
              winnerId,
              status: "finished",
            }
          : item,
      ),
    }));
  },

  generateNextRound: () => {
    if (!get().canGenerateNextRound()) {
      return;
    }

    const { battles } = get();

    const top8Battles = battles.filter((battle) => battle.round === "top8");

    const semifinalBattles = battles.filter(
      (battle) => battle.round === "semifinal",
    );

    const hasSemifinals = semifinalBattles.length > 0;
    const hasFinal = battles.some((battle) => battle.round === "final");

    if (top8Battles.length === 4 && !hasSemifinals) {
      const semifinals = generateSemifinalsFromTop8(top8Battles);

      set((state) => ({
        battles: [...state.battles, ...semifinals],
        activeBattleId: null,
      }));

      return;
    }

    if (semifinalBattles.length === 2 && !hasFinal) {
      const final = generateFinalFromSemifinals(semifinalBattles);

      set((state) => ({
        battles: [...state.battles, final],
        activeBattleId: null,
      }));
    }
  },

  getActiveBattle: () => {
    const { battles, activeBattleId } = get();

    if (!activeBattleId) {
      return null;
    }

    return battles.find((battle) => battle.id === activeBattleId) ?? null;
  },

  getVotesForBattle: (battleId) => {
    return get().votes.filter((vote) => vote.battleId === battleId);
  },

  getJudgeVoteForBattle: (battleId, judgeId) => {
    return (
      get().votes.find(
        (vote) => vote.battleId === battleId && vote.judgeId === judgeId,
      ) ?? null
    );
  },

  canStartBattle: (battleId) => {
    const { event, battles } = get();

    if (event.status !== "battle") {
      return false;
    }

    const battle = battles.find((item) => item.id === battleId);

    if (!battle) {
      return false;
    }

    return battle.status === "pending";
  },

  canSubmitBattleVote: (battleId) => {
    const { event, battles } = get();

    if (event.status !== "battle") {
      return false;
    }

    const battle = battles.find((item) => item.id === battleId);

    if (!battle) {
      return false;
    }

    return battle.status === "active" || battle.status === "voting";
  },
  startBattle: (battleId) => {
    if (!get().canStartBattle(battleId)) {
      return;
    }

    set((state) => ({
      activeBattleId: battleId,
      battles: state.battles.map((battle) =>
        battle.id === battleId
          ? {
              ...battle,
              status: "active",
            }
          : battle,
      ),
    }));
  },
  submitBattleVote: ({ battleId, judgeId, winnerId }) => {
    if (!get().canSubmitBattleVote(battleId)) {
      return;
    }

    const { battles, judges } = get();

    const battle = battles.find((item) => item.id === battleId);

    if (!battle) {
      return;
    }

    const judgeExists = judges.some((judge) => judge.id === judgeId);

    if (!judgeExists) {
      return;
    }

    const isValidWinner =
      winnerId === battle.participantAId || winnerId === battle.participantBId;

    if (!isValidWinner) {
      return;
    }

    set((state) => {
      const existingVote = state.votes.find(
        (vote) => vote.battleId === battleId && vote.judgeId === judgeId,
      );

      const nextVotes = existingVote
        ? state.votes.map((vote) =>
            vote.id === existingVote.id
              ? {
                  ...vote,
                  winnerId,
                }
              : vote,
          )
        : [
            ...state.votes,
            {
              id: createId("vote"),
              battleId,
              judgeId,
              winnerId,
              createdAt: new Date().toISOString(),
            },
          ];

      const currentBattleVotes = nextVotes.filter(
        (vote) => vote.battleId === battleId,
      );

      const allJudgesVoted = currentBattleVotes.length === state.judges.length;

      const calculatedWinnerId = allJudgesVoted
        ? calculateBattleWinner({
            votes: currentBattleVotes,
            judgesCount: state.judges.length,
          })
        : null;

      return {
        votes: nextVotes,
        battles: state.battles.map((item) => {
          if (item.id !== battleId) {
            return item;
          }

          if (!calculatedWinnerId) {
            return {
              ...item,
              status: "voting",
            };
          }

          return {
            ...item,
            status: "finished",
            winnerId: calculatedWinnerId,
          };
        }),
        activeBattleId: calculatedWinnerId ? null : state.activeBattleId,
      };
    });
  },
}));
