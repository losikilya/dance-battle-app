import { create } from "zustand";

import { Participant } from "@domain/participant/types";
import {
  QualificationScore,
  RankedParticipant,
} from "@domain/qualification/types";
import { Battle, BattleVote } from "@domain/battle/types";
import { calculateRanking } from "@domain/qualification/calculateRanking";
import { BattleAppState } from "@domain/sync/appState";
import { AppEvent } from "@domain/sync/appEvent";
import { applyEvent } from "@domain/sync/applyEvent";
import { createInitialBattleState } from "@domain/sync/createInitialBattleState";
import { createCommand } from "@domain/commands/createCommand";
import { handleCommand } from "@domain/commands/commandHandlers";
import { CommandError } from "@domain/commands/commandResult";
import { AppCommand } from "@domain/commands/command";

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

type DemoBattleState = BattleAppState & {
  eventLog: AppEvent[];
  lastCommandError: CommandError | null;
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
  clearLastCommandError: () => void;

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

  replayEventLog: () => void;
};

type DemoBattleStore = DemoBattleState & DemoBattleComputed & DemoBattleActions;

function createInitialStoreState(): DemoBattleState {
  return {
    ...createInitialBattleState(),
    eventLog: [],
    lastCommandError: null,
  };
}

export const useDemoBattleStore = create<DemoBattleStore>((set, get) => {
  const applyAppEvent = (event: AppEvent) => {
    set((state) => {
      const nextBattleState = applyEvent(state, event);

      return {
        ...nextBattleState,
        eventLog: [...state.eventLog, event],
        lastCommandError: null,
      };
    });
  };

  const executeCommand = (command: AppCommand) => {
    const result = handleCommand(get(), command);

    if (result.error) {
      set({
        lastCommandError: result.error,
      });

      return;
    }

    result.events.forEach(applyAppEvent);
  };

  return {
    ...createInitialStoreState(),

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

    canStartQualification: () => {
      const { event, participants, judges } = get();

      return (
        event.status === "draft" &&
        participants.length >= 8 &&
        judges.length > 0
      );
    },

    canGoToNextQualificationParticipant: () => {
      const { participants, currentQualificationParticipantIndex } = get();

      const isLastParticipant =
        currentQualificationParticipantIndex >= participants.length - 1;

      return (
        !isLastParticipant && get().isCurrentParticipantScoredByAllJudges()
      );
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

    clearLastCommandError: () => {
      set({
        lastCommandError: null,
      });
    },

    resetDemo: () => {
      const command = createCommand("event.reset", {});
      const result = handleCommand(get(), command);

      const resetEvent = result.events[0];

      if (!resetEvent) {
        return;
      }

      set({
        ...applyEvent(get(), resetEvent),
        eventLog: [resetEvent],
        lastCommandError: null,
      });
    },

    startQualification: () => {
      executeCommand(createCommand("qualification.start", {}));
    },

    submitQualificationScore: ({ participantId, judgeId, score }) => {
      executeCommand(
        createCommand("qualification.submitScore", {
          participantId,
          judgeId,
          score,
        }),
      );
    },

    goToNextQualificationParticipant: () => {
      executeCommand(createCommand("qualification.goToNextParticipant", {}));
    },

    finishQualification: () => {
      executeCommand(createCommand("qualification.finish", {}));
    },

    generateTop8: () => {
      executeCommand(createCommand("bracket.generateTop8", {}));
    },

    startBattle: (battleId) => {
      executeCommand(
        createCommand("battle.start", {
          battleId,
        }),
      );
    },

    submitBattleVote: ({ battleId, judgeId, winnerId }) => {
      executeCommand(
        createCommand("battle.submitVote", {
          battleId,
          judgeId,
          winnerId,
        }),
      );
    },

    generateNextRound: () => {
      executeCommand(createCommand("battle.generateNextRound", {}));
    },

    replayEventLog: () => {
      const { eventLog } = get();

      const replayedState = eventLog.reduce(
        (state, event) => applyEvent(state, event),
        createInitialBattleState(),
      );

      set({
        ...replayedState,
        eventLog,
        lastCommandError: null,
      });
    },

    submitRandomVotesForBattle: (battleId) => {
      const battle = get().battles.find((item) => item.id === battleId);

      if (!battle) {
        return;
      }

      if (battle.status === "pending") {
        executeCommand(
          createCommand("battle.start", {
            battleId,
          }),
        );
      }

      const activeBattle = get().battles.find((item) => item.id === battleId);

      if (!activeBattle || activeBattle.status === "finished") {
        return;
      }

      get().judges.forEach((judge) => {
        const winnerId =
          Math.random() > 0.5
            ? activeBattle.participantAId
            : activeBattle.participantBId;

        executeCommand(
          createCommand("battle.submitVote", {
            battleId,
            judgeId: judge.id,
            winnerId,
          }),
        );
      });
    },

    fillRandomQualificationScores: () => {
      if (get().event.status === "draft") {
        executeCommand(createCommand("qualification.start", {}));
      }

      const { participants, judges } = get();

      participants.forEach((participant) => {
        judges.forEach((judge) => {
          executeCommand(
            createCommand("qualification.submitScore", {
              participantId: participant.id,
              judgeId: judge.id,
              score: Math.floor(Math.random() * 4) + 7,
            }),
          );
        });
      });

      while (get().canGoToNextQualificationParticipant()) {
        executeCommand(createCommand("qualification.goToNextParticipant", {}));
      }

      executeCommand(createCommand("qualification.finish", {}));
    },
  };
});
