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
import {
  clearAppEvents,
  loadAppEvents,
  saveAppEvents,
} from "../../infrastructure/storage/appEventRepository";

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

  isHydrated: boolean;
  isHydrating: boolean;
  storageError: string | null;
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

type AddParticipantParams = {
  name: string;
  number: number;
  crew?: string;
  city?: string;
};
type CreateEventParams = {
  title: string;
  categoryTitle: string;
  format: import("@domain/event/types").BattleFormat;
  judgesCount: number;
};

type DemoBattleActions = {
  hydrateFromStorage: () => Promise<void>;

  resetDemo: () => Promise<void>;
  clearLastCommandError: () => void;

  createEvent: (params: CreateEventParams) => void;
  addParticipant: (params: AddParticipantParams) => void;
  removeParticipant: (participantId: string) => void;
  toggleParticipantCheckIn: (participantId: string) => void;

  startQualification: () => Promise<void>;
  submitQualificationScore: (
    params: SubmitQualificationScoreParams,
  ) => Promise<void>;
  goToNextQualificationParticipant: () => Promise<void>;
  finishQualification: () => Promise<void>;

  fillRandomQualificationScores: () => Promise<void>;
  generateTop8: () => Promise<void>;

  startBattle: (battleId: string) => Promise<void>;
  submitBattleVote: (params: SubmitBattleVoteParams) => Promise<void>;

  submitRandomVotesForBattle: (battleId: string) => Promise<void>;
  generateNextRound: () => Promise<void>;

  replayEventLog: () => void;
};

type DemoBattleStore = DemoBattleState & DemoBattleComputed & DemoBattleActions;

function pickBattleAppState(state: BattleAppState): BattleAppState {
  return {
    event: state.event,
    participants: state.participants,
    judges: state.judges,
    scores: state.scores,
    battles: state.battles,
    votes: state.votes,
    currentQualificationParticipantIndex:
      state.currentQualificationParticipantIndex,
    activeBattleId: state.activeBattleId,
    systemLogs: state.systemLogs,
  };
}

function createInitialStoreState(): DemoBattleState {
  return {
    ...createInitialBattleState(),
    eventLog: [],
    lastCommandError: null,

    isHydrated: false,
    isHydrating: false,
    storageError: null,
  };
}

export const useDemoBattleStore = create<DemoBattleStore>((set, get) => {
  const applyEventsToStore = (events: AppEvent[]) => {
    set((state) => {
      const nextBattleState = events.reduce(
        (currentState, event) => applyEvent(currentState, event),
        pickBattleAppState(state),
      );

      return {
        ...nextBattleState,
        eventLog: [...state.eventLog, ...events],
        lastCommandError: null,
        storageError: null,
      };
    });
  };

  const executeCommand = async (command: AppCommand) => {
    const result = handleCommand(get(), command);

    if (result.error) {
      set({
        lastCommandError: result.error,
      });

      return;
    }

    try {
      await saveAppEvents(result.events);
      applyEventsToStore(result.events);
    } catch (error) {
      set({
        storageError:
          error instanceof Error
            ? error.message
            : "Failed to save events to storage",
      });
    }
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

    resetDemo: async () => {
      const command = createCommand("event.reset", {});
      const result = handleCommand(get(), command);

      const resetEvent = result.events[0];

      if (!resetEvent) {
        return;
      }

      try {
        await clearAppEvents();
        await saveAppEvents([resetEvent]);

        set({
          ...applyEvent(get(), resetEvent),
          eventLog: [resetEvent],
          lastCommandError: null,
          storageError: null,
          isHydrated: true,
          isHydrating: false,
        });
      } catch (error) {
        set({
          storageError:
            error instanceof Error
              ? error.message
              : "Failed to reset local storage",
        });
      }
    },

    createEvent: async ({ title, categoryTitle, format, judgesCount }) => {
      await executeCommand(
        createCommand("event.create", {
          title,
          categoryTitle,
          format,
          judgesCount,
        }),
      );
    },

    addParticipant: async ({ name, number, crew, city }) => {
      await executeCommand(
        createCommand("participant.add", { name, number, crew, city }),
      );
    },

    removeParticipant: async (participantId) => {
      await executeCommand(
        createCommand("participant.remove", { participantId }),
      );
    },

    toggleParticipantCheckIn: async (participantId) => {
      await executeCommand(
        createCommand("participant.toggleCheckIn", { participantId }),
      );
    },

    startQualification: async () => {
      await executeCommand(createCommand("qualification.start", {}));
    },

    submitQualificationScore: async ({ participantId, judgeId, score }) => {
      await executeCommand(
        createCommand("qualification.submitScore", {
          participantId,
          judgeId,
          score,
        }),
      );
    },

    goToNextQualificationParticipant: async () => {
      await executeCommand(
        createCommand("qualification.goToNextParticipant", {}),
      );
    },

    finishQualification: async () => {
      await executeCommand(createCommand("qualification.finish", {}));
    },

    generateTop8: async () => {
      await executeCommand(createCommand("bracket.generateTop8", {}));
    },

    startBattle: async (battleId) => {
      await executeCommand(
        createCommand("battle.start", {
          battleId,
        }),
      );
    },

    submitBattleVote: async ({ battleId, judgeId, winnerId }) => {
      await executeCommand(
        createCommand("battle.submitVote", {
          battleId,
          judgeId,
          winnerId,
        }),
      );
    },

    generateNextRound: async () => {
      await executeCommand(createCommand("battle.generateNextRound", {}));
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

    submitRandomVotesForBattle: async (battleId) => {
      const battle = get().battles.find((item) => item.id === battleId);

      if (!battle) {
        return;
      }

      if (battle.status === "pending") {
        await executeCommand(
          createCommand("battle.start", {
            battleId,
          }),
        );
      }

      const activeBattle = get().battles.find((item) => item.id === battleId);

      if (!activeBattle || activeBattle.status === "finished") {
        return;
      }

      for (const judge of get().judges) {
        const winnerId =
          Math.random() > 0.5
            ? activeBattle.participantAId
            : activeBattle.participantBId;

        await executeCommand(
          createCommand("battle.submitVote", {
            battleId,
            judgeId: judge.id,
            winnerId,
          }),
        );
      }
    },

    fillRandomQualificationScores: async () => {
      if (get().event.status === "draft") {
        await executeCommand(createCommand("qualification.start", {}));
      }

      const { participants, judges } = get();

      for (const participant of participants) {
        for (const judge of judges) {
          await executeCommand(
            createCommand("qualification.submitScore", {
              participantId: participant.id,
              judgeId: judge.id,
              score: Math.floor(Math.random() * 4) + 7,
            }),
          );
        }

        if (get().canGoToNextQualificationParticipant()) {
          await executeCommand(
            createCommand("qualification.goToNextParticipant", {}),
          );
        }
      }

      await executeCommand(createCommand("qualification.finish", {}));
    },
    hydrateFromStorage: async () => {
      set({
        isHydrating: true,
        storageError: null,
      });

      try {
        const events = await loadAppEvents();

        const restoredBattleState = events.reduce<BattleAppState>(
          (state, event) => applyEvent(state, event),
          createInitialBattleState(),
        );

        set({
          ...restoredBattleState,
          eventLog: events,
          isHydrated: true,
          isHydrating: false,
          storageError: null,
          lastCommandError: null,
        });
      } catch (error) {
        set({
          isHydrated: true,
          isHydrating: false,
          storageError:
            error instanceof Error
              ? error.message
              : "Failed to hydrate battle state",
        });
      }
    },
  };
});
