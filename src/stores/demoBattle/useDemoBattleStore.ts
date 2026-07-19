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
import { getActiveBattleConfigurationId, isInBattleConfiguration } from "@domain/sync/stateSelectors";
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
  canGenerateBracket: () => boolean;
  canStartBattle: (battleId: string) => boolean;
  canOpenBattleVoting: (battleId: string) => boolean;
  canSubmitBattleVote: (battleId: string) => boolean;
  canGenerateNextRound: () => boolean;
};

type AddParticipantParams = {
  battleConfigurationId?: string;
  name: string;
  number: number;
  crew?: string;
  city?: string;
};
type ImportParticipantParams = AddParticipantParams;
type CreateEventParams = {
  title: string;
};
type ConfigureBattleParams = {
  categoryTitle: string;
  qualificationDurationSeconds?: number;
  qualificationAdvanceMode?: "manual" | "automatic";
};

type AssignBattleJudgeParams = {
  battleConfigurationId?: string;
  deviceId: string;
  name: string;
};

type UnassignBattleJudgeParams = {
  battleConfigurationId?: string;
  deviceId: string;
};

export type HostDemoBattleParams = {
  categoryTitle?: string;
  participantsCount?: number;
  format?: BattleFormat;
  qualificationDurationSeconds?: number;
  qualificationAdvanceMode?: "manual" | "automatic";
};

type DemoBattleActions = {
  hydrateFromStorage: () => Promise<void>;
  executeRemoteCommand: (
    command: AppCommand,
  ) => Promise<CommandHandlerResult>;
  loadHostDemoBattle: (params?: HostDemoBattleParams) => Promise<string | null>;

  resetDemo: () => Promise<void>;
  deleteLocalEvent: () => Promise<void>;
  clearLastCommandError: () => void;

  createEvent: (params: CreateEventParams) => Promise<boolean>;
  finishEvent: () => Promise<void>;
  configureBattle: (params: ConfigureBattleParams) => Promise<string | null>;
  selectBattleConfiguration: (battleConfigurationId: string) => Promise<void>;
  assignBattleJudge: (params: AssignBattleJudgeParams) => Promise<string | null>;
  unassignBattleJudge: (params: UnassignBattleJudgeParams) => Promise<void>;
  addParticipant: (params: AddParticipantParams) => void;
  importParticipants: (participants: ImportParticipantParams[]) => Promise<boolean>;
  removeParticipant: (participantId: string) => void;
  toggleParticipantCheckIn: (participantId: string) => void;

  startQualification: (battleConfigurationId?: string) => Promise<void>;
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
  generateBracket: (participantIds: string[]) => Promise<void>;

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

function getAssignedBattleJudges(state: BattleAppState) {
  const assignedJudgeIds = state.event.battleConfiguration?.assignedJudgeIds ?? [];

  return state.judges.filter((judge) => assignedJudgeIds.includes(judge.id));
}

function getActiveBattleParticipants(state: BattleAppState): Participant[] {
  const configId = getActiveBattleConfigurationId(state.event);
  return state.participants.filter((p) => isInBattleConfiguration(configId, p));
}

function getActiveBattleScores(state: BattleAppState): QualificationScore[] {
  const activeParticipantIds = new Set(
    getActiveBattleParticipants(state).map((p) => p.id),
  );
  const activeJudgeIds = new Set(
    getAssignedBattleJudges(state).map((j) => j.id),
  );

  return state.scores.filter(
    (score) =>
      activeParticipantIds.has(score.participantId) &&
      activeJudgeIds.has(score.judgeId),
  );
}

function getActiveBattles(state: BattleAppState): Battle[] {
  const configId = getActiveBattleConfigurationId(state.event);
  return state.battles.filter((b) => isInBattleConfiguration(configId, b));
}

function isBattleInActiveConfiguration(state: BattleAppState, battle: Battle): boolean {
  return isInBattleConfiguration(getActiveBattleConfigurationId(state.event), battle);
}

function getBattleConfigurationStatus(
  state: BattleAppState,
  battle: Battle,
): BattleAppState['event']['status'] {
  if (!battle.battleConfigurationId) {
    return state.event.status;
  }

  return state.event.battleConfigurations.find(
    (configuration) => configuration.id === battle.battleConfigurationId,
  )?.status ?? state.event.status;
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

  const applyEventsToStore = (
    events: AppEvent[],
    replaceEventLog = false,
  ): void => {
    set((state) => {
      const nextBattleState = events.reduce(
        (currentState, event) => applyEvent(currentState, event),
        pickBattleAppState(state),
      );

      return {
        ...nextBattleState,
        eventLog: replaceEventLog ? events : [...state.eventLog, ...events],
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
        const replacesExistingEvent = command.type === "event.create";

        if (replacesExistingEvent) {
          await replaceAppEvents(result.events);
        } else {
          await saveAppEvents(result.events);
        }

        applyEventsToStore(result.events, replacesExistingEvent);
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
      getActiveBattleParticipants(state).length - 1;

    if (
      state.event.battleConfiguration?.qualificationAdvanceMode === "automatic" &&
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

    loadHostDemoBattle: async (params = {}) => {
      return await enqueueOperation(async () => {
        const categoryTitle = params.categoryTitle ?? "Hip-Hop 1x1";
        const participantsCount = Math.max(
          0,
          Math.floor(params.participantsCount ?? 10),
        );
        const qualificationDurationSeconds =
          params.qualificationDurationSeconds ?? 60;
        const qualificationAdvanceMode =
          params.qualificationAdvanceMode ?? "manual";

        let nextState = pickBattleAppState(get());
        const nextEvents: AppEvent[] = [];
        let demoBattleConfigurationId: string | null = null;

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

        appendCommand(
          createCommand("battle.configure", {
            categoryTitle,
            qualificationDurationSeconds,
            qualificationAdvanceMode,
          }),
        );
        demoBattleConfigurationId =
          nextEvents.findLast((event) => event.type === "battle.configured")
            ?.payload.configuration.id ?? null;

        if (!demoBattleConfigurationId) {
          throw new Error("Demo battle configuration was not created");
        }

        appendCommand(
          createCommand("battle.assignJudge", {
            battleConfigurationId: demoBattleConfigurationId,
            deviceId: "demo_host",
            name: "Judge Alex",
          }),
        );

        for (const participant of nextState.participants.filter(
          (item) => item.battleConfigurationId === demoBattleConfigurationId,
        )) {
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
              {
                ...createHostDemoParticipant(index),
                battleConfigurationId: demoBattleConfigurationId,
              },
            ),
          );
        }

        try {
          await saveAppEvents(nextEvents);
          set({
            ...nextState,
            eventLog: [...get().eventLog, ...nextEvents],
            lastCommandError: null,
            storageError: null,
            isHydrated: true,
            isHydrating: false,
          });
          scheduleQualificationTimerCoordinator();
          return demoBattleConfigurationId;
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to load Host demo battle";

          set({ storageError: message });
          throw error;
        }
      });
    },

    getRanking: () => {
      const state = get();
      const participants = getActiveBattleParticipants(state);

      return calculateRanking({
        participants,
        scores: getActiveBattleScores(state),
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
      const battles = getActiveBattles(get());

      const finalBattle = battles.find(
        (battle) => battle.round === "final" && battle.winnerId,
      );

      return finalBattle?.winnerId ?? null;
    },

    getCurrentQualificationParticipant: () => {
      const state = get();
      const participants = getActiveBattleParticipants(state);
      const { currentQualificationParticipantIndex } = state;

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
        durationSeconds:
          event.battleConfiguration?.qualificationDurationSeconds ?? 60,
        advanceMode:
          event.battleConfiguration?.qualificationAdvanceMode ?? "manual",
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

      const state = get();
      const { scores } = state;
      const judges = getAssignedBattleJudges(state);

      const currentParticipantScores = scores.filter(
        (score) => score.participantId === currentParticipant.id,
      );

      const uniqueJudgeIds = new Set(
        currentParticipantScores.map((score) => score.judgeId),
      );

      return uniqueJudgeIds.size === judges.length;
    },

    isQualificationFinished: () => {
      const state = get();
      const participants = getActiveBattleParticipants(state);
      const scores = getActiveBattleScores(state);
      const judges = getAssignedBattleJudges(state);

      const expectedScoresCount = participants.length * judges.length;

      return scores.length >= expectedScoresCount;
    },

    getActiveBattle: () => {
      const state = get();
      const { activeBattleId } = state;

      if (!activeBattleId) {
        return null;
      }

      return getActiveBattles(state).find(
        (battle) => battle.id === activeBattleId,
      ) ?? null;
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
      const { event, judges } = get();
      const activeParticipants = getActiveBattleParticipants(get());
      const assignedJudgeIds = event.battleConfiguration?.assignedJudgeIds ?? [];

      return (
        event.status === "draft" &&
        event.battleConfiguration !== null &&
        activeParticipants.length > 0 &&
        judges.some((judge) => assignedJudgeIds.includes(judge.id))
      );
    },

    canGoToNextQualificationParticipant: () => {
      return get().canManuallyAdvanceQualificationParticipant();
    },

    canManuallyAdvanceQualificationParticipant: () => {
      const state = get();
      const { event, currentQualificationParticipantIndex } = state;
      const participants = getActiveBattleParticipants(state);

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

    canGenerateBracket: () => {
      const state = get();
      const { event, judges } = state;
      const participants = getActiveBattleParticipants(state);
      const battles = getActiveBattles(state);
      const scores = getActiveBattleScores(state);

      if (event.status !== "qualification_finished") {
        return false;
      }

      if (battles.length > 0) {
        return false;
      }

      if (participants.length < 2) {
        return false;
      }

      const assignedJudgeIds = event.battleConfiguration?.assignedJudgeIds ?? [];
      const assignedJudges = judges.filter((judge) =>
        assignedJudgeIds.includes(judge.id),
      );

      const expectedScoresCount = participants.length * assignedJudges.length;

      return scores.length >= expectedScoresCount;
    },

    canStartBattle: (battleId) => {
      const state = get();
      const { battles } = state;

      const battle = battles.find((item) => item.id === battleId);

      if (!battle) {
        return false;
      }

      return getBattleConfigurationStatus(state, battle) === "battle" &&
        battle.status === "pending";
    },

    canOpenBattleVoting: (battleId) => {
      const state = get();
      const { battles } = state;

      const battle = battles.find((item) => item.id === battleId);

      if (!battle) {
        return false;
      }

      return getBattleConfigurationStatus(state, battle) === 'battle' &&
        battle.status === 'active';
    },

    canSubmitBattleVote: (battleId) => {
      const state = get();
      const { battles } = state;

      const battle = battles.find((item) => item.id === battleId);

      if (!battle) {
        return false;
      }

      return getBattleConfigurationStatus(state, battle) === "battle" &&
        battle.status === "voting";
    },

    canGenerateNextRound: () => {
      const battles = getActiveBattles(get());
      const roundOrder = ["custom", "top32", "top16", "top8", "semifinal", "final"] as const;
      const latestRoundIndex = roundOrder.findLastIndex((round) =>
        battles.some((battle) => battle.round === round),
      );

      if (latestRoundIndex < 0 || latestRoundIndex === roundOrder.length - 1) {
        return false;
      }

      const currentRound = roundOrder[latestRoundIndex];
      const currentBattles = battles.filter(
        (battle) => battle.round === currentRound,
      );

      return currentBattles.length > 0 &&
        currentBattles.every((battle) => battle.status === "finished");
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

    deleteLocalEvent: async () => {
      try {
        clearQualificationTimerTimeout();
        await clearAppEvents();

        set({
          ...createInitialStoreState(),
          isHydrated: true,
          isHydrating: false,
        });
      } catch (error) {
        set({
          storageError:
            error instanceof Error
              ? error.message
              : "Failed to delete local event",
        });
      }
    },

    createEvent: async ({ title }) => {
      const previousEventId = get().event.id;

      await executeCommand(
        createCommand("event.create", {
          title,
        }),
      );

      return get().event.id !== previousEventId;
    },

    finishEvent: async () => {
      await executeCommand(createCommand("event.finish", {}));
    },

    configureBattle: async (params) => {
      const previousConfigurationIds = new Set(
        get().event.battleConfigurations.map((configuration) => configuration.id),
      );

      await executeCommand(createCommand("battle.configure", params));

      return get().event.battleConfigurations.find(
        (configuration) => !previousConfigurationIds.has(configuration.id),
      )?.id ?? null;
    },

    selectBattleConfiguration: async (battleConfigurationId) => {
      await executeCommand(
        createCommand("battle.selectConfiguration", {
          battleConfigurationId,
        }),
      );
    },

    assignBattleJudge: async (params) => {
      await executeCommand(createCommand("battle.assignJudge", params));

      const configurationId =
        params.battleConfigurationId ?? get().event.battleConfiguration?.id;

      return get().judges.find(
        (judge) =>
          judge.deviceId === params.deviceId &&
          judge.battleConfigurationId === configurationId,
      )?.id ?? null;
    },

    unassignBattleJudge: async (params) => {
      await executeCommand(createCommand("battle.unassignJudge", params));
    },

    addParticipant: async ({ battleConfigurationId, name, number, crew, city }) => {
      await executeCommand(
        createCommand("participant.add", {
          battleConfigurationId,
          name,
          number,
          crew,
          city,
        }),
      );
    },

    importParticipants: async (participants) => {
      const previousCount = getActiveBattleParticipants(get()).length;

      await executeCommand(
        createCommand("participant.import", { participants }),
      );

      return getActiveBattleParticipants(get()).length > previousCount;
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

    startQualification: async (battleConfigurationId) => {
      await executeCommand(
        createCommand("qualification.start", { battleConfigurationId }),
      );
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

    generateBracket: async (participantIds) => {
      await executeCommand(createCommand("bracket.generate", { participantIds }));
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

      for (const judge of getAssignedBattleJudges(get())) {
        const participantIds = afterOpen.participantIds ?? [
          afterOpen.participantAId,
          afterOpen.participantBId,
        ];
        const winnerId =
          participantIds[Math.floor(Math.random() * participantIds.length)] ??
          afterOpen.participantAId;

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
      const initialState = get();
      const activeBattleConfigurationId =
        initialState.event.activeBattleConfigurationId ??
        initialState.event.battleConfiguration?.id;

      if (
        activeBattleConfigurationId &&
        getActiveBattleParticipants(initialState).length === 0
      ) {
        for (let index = 0; index < 10; index += 1) {
          await executeCommand(
            createCommand("participant.add", {
              ...createHostDemoParticipant(index),
              battleConfigurationId: activeBattleConfigurationId,
            }),
          );
        }
      }

      const stateAfterParticipants = get();
      const assignedJudges = getAssignedBattleJudges(stateAfterParticipants);

      if (
        activeBattleConfigurationId &&
        assignedJudges.length === 0
      ) {
        await executeCommand(
          createCommand("battle.assignJudge", {
            battleConfigurationId: activeBattleConfigurationId,
            deviceId: "demo_host",
            name: "Judge Alex",
          }),
        );
      }

      if (get().event.status === "draft") {
        await executeCommand(createCommand("qualification.start", {}));
      }

      const state = get();
      const participants = getActiveBattleParticipants(state);
      const judges = getAssignedBattleJudges(state);

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
