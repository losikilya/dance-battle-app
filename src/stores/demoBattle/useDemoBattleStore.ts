import { create } from "zustand";
import { AppState } from "react-native";

import { Participant } from "@domain/participant/types";
import {
  QualificationScore,
  QualificationTimerState,
  RankedParticipant,
} from "@domain/qualification/types";
import { Battle, BattleVote } from "@domain/battle/types";
import { calculateRanking } from "@domain/qualification/calculateRanking";
import { BattleAppState } from "@domain/sync/appState";
import { AppEvent } from "@domain/sync/appEvent";
import { applyEvent } from "@domain/sync/applyEvent";
import { createInitialBattleState } from "@domain/sync/createInitialBattleState";
import { createDemoParticipants } from "@domain/demo/createDemoEvent";
import type { BattleFormat } from "@domain/event/types";
import { createCommand } from "@domain/commands/createCommand";
import { handleCommand } from "@domain/commands/commandHandlers";
import {
  CommandError,
  CommandHandlerResult,
  commandFailure,
} from "@domain/commands/commandResult";
import { AppCommand } from "@domain/commands/command";
import {
  clearAppEvents,
  loadAppEvents,
  replaceAppEvents,
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
  getQualificationTimer: () => QualificationTimerState;
  getQualificationTimerRemainingMs: (nowMs?: number) => number;
  getQualificationTimingConfig: () => {
    durationSeconds: number;
    advanceMode: "manual" | "automatic";
  };
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
  canManuallyAdvanceQualificationParticipant: () => boolean;
  canFinishQualification: () => boolean;
  canGenerateTop8: () => boolean;
  canStartBattle: (battleId: string) => boolean;
  canOpenBattleVoting: (battleId: string) => boolean;
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
  format: BattleFormat;
  judgesCount: number;
  qualificationDurationSeconds?: number;
  qualificationAdvanceMode?: "manual" | "automatic";
};

export type HostDemoEventParams = {
  title?: string;
  categoryTitle?: string;
  participantsCount?: number;
  judgesCount?: number;
  format?: BattleFormat;
  qualificationDurationSeconds?: number;
  qualificationAdvanceMode?: "manual" | "automatic";
};

type DemoBattleActions = {
  hydrateFromStorage: () => Promise<void>;
  executeRemoteCommand: (
    command: AppCommand,
  ) => Promise<CommandHandlerResult>;
  createHostDemoEvent: (params?: HostDemoEventParams) => Promise<void>;

  resetDemo: () => Promise<void>;
  clearLastCommandError: () => void;

  createEvent: (params: CreateEventParams) => Promise<string | null>;
  addParticipant: (params: AddParticipantParams) => void;
  removeParticipant: (participantId: string) => void;
  toggleParticipantCheckIn: (participantId: string) => void;

  startQualification: () => Promise<void>;
  submitQualificationScore: (
    params: SubmitQualificationScoreParams,
  ) => Promise<void>;
  pauseQualificationTimer: () => Promise<void>;
  resumeQualificationTimer: () => Promise<void>;
  restartQualificationTimer: () => Promise<void>;
  advanceQualificationParticipant: () => Promise<void>;
  goToNextQualificationParticipant: () => Promise<void>;
  finishQualification: () => Promise<void>;

  fillRandomQualificationScores: () => Promise<void>;
  generateTop8: () => Promise<void>;

  startBattle: (battleId: string) => Promise<void>;
  openBattleVoting: (battleId: string) => Promise<void>;
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
    qualificationTimer: state.qualificationTimer,
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

function createHostDemoParticipant(
  index: number,
): Omit<Participant, "id" | "checkIn" | "status"> {
  const demoParticipant = createDemoParticipants()[index];

  if (demoParticipant) {
    return {
      number: index + 1,
      name: demoParticipant.name,
      crew: demoParticipant.crew,
      city: demoParticipant.city,
    };
  }

  return {
    number: index + 1,
    name: `Dancer ${index + 1}`,
    crew: `Crew ${(index % 5) + 1}`,
    city: `City ${(index % 4) + 1}`,
  };
}

export const useDemoBattleStore = create<DemoBattleStore>((set, get) => {
  let commandQueue: Promise<void> = Promise.resolve();
  let qualificationTimerTimeout: ReturnType<typeof setTimeout> | null = null;
  let appStateSubscriptionStarted = false;

  const clearQualificationTimerTimeout = (): void => {
    if (qualificationTimerTimeout !== null) {
      clearTimeout(qualificationTimerTimeout);
      qualificationTimerTimeout = null;
    }
  };

  let scheduleQualificationTimerCoordinator = (): void => {};

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
    scheduleQualificationTimerCoordinator();
  };

  const enqueueOperation = <T>(operation: () => Promise<T>): Promise<T> => {
    const execution = commandQueue.then(operation);

    commandQueue = execution.then(
      () => undefined,
      () => undefined,
    );

    return execution;
  };

  const executePersistedCommand = (
    command: AppCommand,
  ): Promise<CommandHandlerResult> =>
    enqueueOperation(async () => {
      const result = handleCommand(pickBattleAppState(get()), command);

      if (result.error) {
        set({
          lastCommandError: result.error,
        });

        return result;
      }

      try {
        await saveAppEvents(result.events);
        applyEventsToStore(result.events);
        return result;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to save events to storage";

        set({
          storageError: message,
        });

        return commandFailure(
          "action_not_allowed",
          `Failed to persist command events: ${message}`,
        );
      }
    });

  const executeCommand = async (command: AppCommand): Promise<void> => {
    await executePersistedCommand(command);
  };

  const handleQualificationTimerExpired = async (): Promise<void> => {
    const state = get();
    const timer = state.qualificationTimer;

    if (
      state.event.status !== "qualification" ||
      timer.status !== "running" ||
      timer.participantId === null ||
      timer.endsAt === null ||
      Date.parse(timer.endsAt) > Date.now()
    ) {
      return;
    }

    const isLastParticipant =
      state.currentQualificationParticipantIndex >=
      state.participants.length - 1;

    if (
      state.event.qualificationAdvanceMode === "automatic" &&
      !isLastParticipant
    ) {
      await executeCommand(
        createCommand("qualification.advanceParticipant", {
          reason: "automatic",
          participantId: timer.participantId,
        }),
      );
      return;
    }

    await executeCommand(
      createCommand("qualification.timer.expire", {
        participantId: timer.participantId,
      }),
    );
  };

  scheduleQualificationTimerCoordinator = (): void => {
    clearQualificationTimerTimeout();

    const state = get();
    const timer = state.qualificationTimer;

    if (
      state.event.status !== "qualification" ||
      timer.status !== "running" ||
      timer.endsAt === null
    ) {
      return;
    }

    const delayMs = Math.max(0, Date.parse(timer.endsAt) - Date.now());

    qualificationTimerTimeout = setTimeout(() => {
      qualificationTimerTimeout = null;
      void handleQualificationTimerExpired();
    }, delayMs);
  };

  const startAppStateCoordinator = (): void => {
    if (appStateSubscriptionStarted) {
      return;
    }

    appStateSubscriptionStarted = true;
    AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        scheduleQualificationTimerCoordinator();
      }
    });
  };

  startAppStateCoordinator();

  return {
    ...createInitialStoreState(),

    executeRemoteCommand: executePersistedCommand,

    createHostDemoEvent: async (params = {}) => {
      await enqueueOperation(async () => {
        const title = params.title ?? "Urban Clash 2026";
        const categoryTitle = params.categoryTitle ?? "Hip-Hop 1x1";
        const participantsCount = Math.max(
          0,
          Math.floor(params.participantsCount ?? 10),
        );
        const judgesCount = Math.max(
          1,
          Math.floor(params.judgesCount ?? 1),
        );
        const format = params.format ?? "top8";
        const qualificationDurationSeconds =
          params.qualificationDurationSeconds ?? 60;
        const qualificationAdvanceMode =
          params.qualificationAdvanceMode ?? "manual";

        let nextState = pickBattleAppState(get());
        const nextEvents: AppEvent[] = [];

        const appendCommand = (command: AppCommand): void => {
          const result = handleCommand(nextState, command);

          if (result.error) {
            throw new Error(result.error.message);
          }

          nextEvents.push(...result.events);
          nextState = result.events.reduce(
            (state, event) => applyEvent(state, event),
            nextState,
          );
        };

        appendCommand(createCommand("event.reset", {}));
        appendCommand(
          createCommand("event.create", {
            title,
            categoryTitle,
            format,
            judgesCount,
            qualificationDurationSeconds,
            qualificationAdvanceMode,
          }),
        );

        for (const participant of nextState.participants) {
          appendCommand(
            createCommand("participant.remove", {
              participantId: participant.id,
            }),
          );
        }

        for (let index = 0; index < participantsCount; index += 1) {
          appendCommand(
            createCommand(
              "participant.add",
              createHostDemoParticipant(index),
            ),
          );
        }

        try {
          await replaceAppEvents(nextEvents);
          set({
            ...nextState,
            eventLog: nextEvents,
            lastCommandError: null,
            storageError: null,
            isHydrated: true,
            isHydrating: false,
          });
          scheduleQualificationTimerCoordinator();
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to create Host demo event";

          set({ storageError: message });
          throw error;
        }
      });
    },

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

    getQualificationTimer: () => get().qualificationTimer,

    getQualificationTimerRemainingMs: (nowMs = Date.now()) => {
      const timer = get().qualificationTimer;

      if (timer.status === "paused") {
        return timer.remainingMsWhenPaused ?? 0;
      }

      if (timer.status !== "running" || timer.endsAt === null) {
        return 0;
      }

      return Math.max(0, Date.parse(timer.endsAt) - nowMs);
    },

    getQualificationTimingConfig: () => {
      const { event } = get();

      return {
        durationSeconds: event.qualificationDurationSeconds,
        advanceMode: event.qualificationAdvanceMode,
      };
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
      return get().canManuallyAdvanceQualificationParticipant();
    },

    canManuallyAdvanceQualificationParticipant: () => {
      const { event, participants, currentQualificationParticipantIndex } = get();

      const isLastParticipant =
        currentQualificationParticipantIndex >= participants.length - 1;

      return (
        event.status === "qualification" &&
        participants.length > 0 &&
        !isLastParticipant
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

    canOpenBattleVoting: (battleId) => {
      const { event, battles } = get();

      if (event.status !== 'battle') {
        return false;
      }

      const battle = battles.find((item) => item.id === battleId);

      if (!battle) {
        return false;
      }

      return battle.status === 'active';
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

      return battle.status === "voting";
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
        scheduleQualificationTimerCoordinator();
      } catch (error) {
        set({
          storageError:
            error instanceof Error
              ? error.message
              : "Failed to reset local storage",
        });
      }
    },

    createEvent: async ({
      title,
      categoryTitle,
      format,
      judgesCount,
      qualificationDurationSeconds,
      qualificationAdvanceMode,
    }) => {
      const previousEventId = get().event.id;

      await executeCommand(
        createCommand("event.create", {
          title,
          categoryTitle,
          format,
          judgesCount,
          qualificationDurationSeconds,
          qualificationAdvanceMode,
        }),
      );

      return get().event.id === previousEventId
        ? null
        : get().judges[0]?.id ?? null;
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

    pauseQualificationTimer: async () => {
      await executeCommand(createCommand("qualification.timer.pause", {}));
    },

    resumeQualificationTimer: async () => {
      await executeCommand(createCommand("qualification.timer.resume", {}));
    },

    restartQualificationTimer: async () => {
      await executeCommand(createCommand("qualification.timer.restart", {}));
    },

    advanceQualificationParticipant: async () => {
      await executeCommand(
        createCommand("qualification.advanceParticipant", {
          reason: "manual",
        }),
      );
    },

    goToNextQualificationParticipant: async () => {
      await get().advanceQualificationParticipant();
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

    openBattleVoting: async (battleId) => {
      await executeCommand(
        createCommand('battle.openVoting', { battleId }),
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
      scheduleQualificationTimerCoordinator();
    },

    submitRandomVotesForBattle: async (battleId) => {
      const battle = get().battles.find((item) => item.id === battleId);

      if (!battle) {
        return;
      }

      if (battle.status === 'pending') {
        await executeCommand(
          createCommand('battle.start', { battleId }),
        );
      }

      const afterStart = get().battles.find((item) => item.id === battleId);

      if (!afterStart || afterStart.status === 'finished') {
        return;
      }

      if (afterStart.status === 'active') {
        await executeCommand(
          createCommand('battle.openVoting', { battleId }),
        );
      }

      const afterOpen = get().battles.find((item) => item.id === battleId);

      if (!afterOpen || afterOpen.status !== 'voting') {
        return;
      }

      for (const judge of get().judges) {
        const winnerId =
          Math.random() > 0.5
            ? afterOpen.participantAId
            : afterOpen.participantBId;

        await executeCommand(
          createCommand('battle.submitVote', {
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
        scheduleQualificationTimerCoordinator();
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
