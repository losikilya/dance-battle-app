import { BattleAppState } from "./appState";
import { AppEvent } from "./appEvent";
import { createInitialBattleState } from "./createInitialBattleState";
import { getActiveBattleConfigurationId, isInBattleConfiguration } from "./stateSelectors";
import { BattleConfiguration, DanceEvent } from "../event/types";
import { QualificationTimerState } from "../qualification/types";

function logEntry(message: string): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `[${hh}:${mm}:${ss}] ${message}`;
}

function createIdleQualificationTimer(
  durationSeconds: number,
): QualificationTimerState {
  return {
    status: 'idle',
    participantId: null,
    durationSeconds,
    endsAt: null,
    remainingMsWhenPaused: null,
  };
}

function normalizeBattleConfiguration(
  configuration: Partial<BattleConfiguration> & {
    categoryTitle?: string;
    status?: DanceEvent['status'];
    format?: 'top8' | 'top16' | 'top32' | null;
    judgesCount?: number;
  },
  fallbackId: string,
  fallbackAssignedJudgeIds: string[] = [],
  fallbackStatus: DanceEvent['status'] = 'draft',
): BattleConfiguration {
  return {
    id: configuration.id ?? fallbackId,
    categoryTitle: configuration.categoryTitle ?? 'Battle',
    status: configuration.status ?? fallbackStatus,
    format: configuration.format ?? null,
    assignedJudgeIds:
      configuration.assignedJudgeIds ?? fallbackAssignedJudgeIds,
    qualificationDurationSeconds:
      configuration.qualificationDurationSeconds ?? 60,
    qualificationAdvanceMode:
      configuration.qualificationAdvanceMode ?? 'manual',
  };
}

function normalizeDanceEvent(event: DanceEvent): DanceEvent {
  const legacyEvent = event as DanceEvent & {
    categoryTitle?: string;
    format?: 'top8' | 'top16' | 'top32';
    judgesCount?: number;
    qualificationDurationSeconds?: number;
    qualificationAdvanceMode?: 'manual' | 'automatic';
  };

  const battleConfiguration = legacyEvent.battleConfiguration
    ? normalizeBattleConfiguration(
        legacyEvent.battleConfiguration,
        'battle_config_legacy',
        [],
        legacyEvent.status,
      )
    : legacyEvent.format
      ? normalizeBattleConfiguration(
          {
            categoryTitle: legacyEvent.categoryTitle,
            format: legacyEvent.format,
            qualificationDurationSeconds:
              legacyEvent.qualificationDurationSeconds,
            qualificationAdvanceMode: legacyEvent.qualificationAdvanceMode,
          },
          'battle_config_legacy',
          [],
          legacyEvent.status,
        )
      : null;

  return {
    id: legacyEvent.id,
    title: legacyEvent.title,
    status: legacyEvent.status,
    createdAt: legacyEvent.createdAt,
    battleConfiguration,
    battleConfigurations:
      legacyEvent.battleConfigurations?.map((configuration, index) =>
        normalizeBattleConfiguration(
          configuration,
          `battle_config_legacy_${index + 1}`,
          [],
          legacyEvent.status,
        ),
      ) ?? (battleConfiguration ? [battleConfiguration] : []),
    activeBattleConfigurationId:
      legacyEvent.activeBattleConfigurationId ?? battleConfiguration?.id ?? null,
  };
}

function updateBattleConfigurationStatus(
  state: BattleAppState,
  status: DanceEvent['status'],
): DanceEvent {
  const activeBattleConfigurationId =
    state.event.activeBattleConfigurationId ?? state.event.battleConfiguration?.id;

  if (!activeBattleConfigurationId) {
    return {
      ...state.event,
      status,
    };
  }

  const nextBattleConfiguration = state.event.battleConfiguration?.id === activeBattleConfigurationId
    ? { ...state.event.battleConfiguration, status }
    : state.event.battleConfiguration;

  return {
    ...state.event,
    status,
    battleConfiguration: nextBattleConfiguration,
    battleConfigurations: (state.event.battleConfigurations ?? []).map(
      (configuration) =>
        configuration.id === activeBattleConfigurationId
          ? { ...configuration, status }
          : configuration,
    ),
  };
}


export function applyEvent(
  state: BattleAppState,
  event: AppEvent,
): BattleAppState {
  switch (event.type) {
    case "event.reset": {
      return createInitialBattleState();
    }

    case "event.created": {
      return {
        ...createInitialBattleState(),
        event: normalizeDanceEvent(event.payload.event),
        participants: [],
        judges:
          (event.payload as { judges?: BattleAppState['judges'] }).judges ?? [],
        qualificationTimer: createIdleQualificationTimer(60),
        systemLogs: [logEntry(`Event "${event.payload.event.title}" initialized.`)],
      };
    }

    case "event.finished": {
      return {
        ...state,
        event: {
          ...state.event,
          status: "finished",
        },
        activeBattleId: null,
        qualificationTimer: createIdleQualificationTimer(
          state.event.battleConfiguration?.qualificationDurationSeconds ?? 60,
        ),
        systemLogs: [...state.systemLogs, logEntry('Event finished.')],
      };
    }

    case "battle.configured": {
      const legacyPayload = event.payload as typeof event.payload & {
        judges?: BattleAppState['judges'];
      };
      const nextJudges = legacyPayload.judges ?? state.judges;
      const assignedJudgeIds = legacyPayload.judges?.map((judge) => judge.id);
      const configuration = normalizeBattleConfiguration(
        event.payload.configuration,
        state.event.battleConfiguration?.id ?? 'battle_config_legacy',
        assignedJudgeIds,
      );
      const currentConfigurations = state.event.battleConfigurations ?? [];
      const existingConfigurations = currentConfigurations.filter(
        (item) => item.id !== configuration.id,
      );
      const shouldActivateConfiguredBattle = state.event.status === "draft" ||
        state.event.battleConfiguration === null;

      return {
        ...state,
        event: {
          ...state.event,
          battleConfiguration: shouldActivateConfiguredBattle
            ? configuration
            : state.event.battleConfiguration,
          status: shouldActivateConfiguredBattle
            ? configuration.status
            : state.event.status,
          battleConfigurations: [
            ...existingConfigurations,
            configuration,
          ],
          activeBattleConfigurationId: shouldActivateConfiguredBattle
            ? configuration.id
            : state.event.activeBattleConfigurationId,
        },
        judges: nextJudges,
        scores: shouldActivateConfiguredBattle ? [] : state.scores,
        battles: shouldActivateConfiguredBattle ? [] : state.battles,
        votes: shouldActivateConfiguredBattle ? [] : state.votes,
        qualificationTimer: shouldActivateConfiguredBattle
          ? createIdleQualificationTimer(configuration.qualificationDurationSeconds)
          : state.qualificationTimer,
        systemLogs: [...state.systemLogs, logEntry('Battle configured.')],
      };
    }

    case "battle.judgeAssigned": {
      const existingJudge = state.judges.find(
        (judge) => judge.id === event.payload.judge.id,
      );
      const nextJudges = existingJudge
        ? state.judges.map((judge) =>
            judge.id === event.payload.judge.id ? event.payload.judge : judge,
          )
        : [...state.judges, event.payload.judge];
      const currentConfigurations = state.event.battleConfigurations ?? [];
      const nextConfiguration = currentConfigurations.find(
        (configuration) => configuration.id === event.payload.battleConfigurationId,
      ) ?? state.event.battleConfiguration;

      if (!nextConfiguration) {
        return state;
      }

      const assignedJudgeIds = Array.from(
        new Set([...nextConfiguration.assignedJudgeIds, event.payload.judge.id]),
      );
      const updatedConfiguration = {
        ...nextConfiguration,
        assignedJudgeIds,
      };

      return {
        ...state,
        judges: nextJudges,
        event: {
          ...state.event,
          battleConfiguration:
            state.event.battleConfiguration?.id === updatedConfiguration.id
              ? updatedConfiguration
              : state.event.battleConfiguration,
          battleConfigurations: currentConfigurations.map(
            (configuration) =>
              configuration.id === updatedConfiguration.id
                ? updatedConfiguration
                : configuration,
          ),
        },
        systemLogs: [
          ...state.systemLogs,
          logEntry(`Judge "${event.payload.judge.name}" assigned.`),
        ],
      };
    }

    case "battle.configurationSelected": {
      const currentConfigurations = state.event.battleConfigurations ?? [];
      const selectedConfiguration = currentConfigurations.find(
        (configuration) =>
          configuration.id === event.payload.battleConfigurationId,
      );

      if (!selectedConfiguration) {
        return state;
      }

      const selectedActiveBattle = state.battles.find(
        (battle) =>
          isInBattleConfiguration(selectedConfiguration.id, battle) &&
          (battle.status === 'active' || battle.status === 'voting'),
      );

      return {
        ...state,
        event: {
          ...state.event,
          battleConfiguration: selectedConfiguration,
          activeBattleConfigurationId: selectedConfiguration.id,
          status: selectedConfiguration.status,
        },
        activeBattleId: selectedActiveBattle?.id ?? null,
        systemLogs: [
          ...state.systemLogs,
          logEntry(`Battle "${selectedConfiguration.categoryTitle}" selected.`),
        ],
      };
    }

    case "qualification.started": {
      const activeBattleConfigurationId = getActiveBattleConfigurationId(state.event);
      const activeParticipants = state.participants.filter((participant) =>
        isInBattleConfiguration(activeBattleConfigurationId, participant),
      );
      const activeParticipantIds = new Set(
        activeParticipants.map((participant) => participant.id),
      );
      const activeBattles = state.battles.filter((battle) =>
        isInBattleConfiguration(activeBattleConfigurationId, battle),
      );
      const activeBattleIds = new Set(activeBattles.map((battle) => battle.id));

      return {
        ...state,
        event: {
          ...updateBattleConfigurationStatus(state, "qualification"),
        },
        scores: state.scores.filter(
          (score) => !activeParticipantIds.has(score.participantId),
        ),
        battles: state.battles.filter(
          (battle) => !activeBattleIds.has(battle.id),
        ),
        votes: state.votes.filter((vote) => !activeBattleIds.has(vote.battleId)),
        activeBattleId: null,
        currentQualificationParticipantIndex:
          event.payload.currentParticipantIndex,
        qualificationTimer:
          event.payload.timer ??
          createIdleQualificationTimer(
            state.event.battleConfiguration?.qualificationDurationSeconds ?? 60,
          ),
        systemLogs: [...state.systemLogs, logEntry('Qualification started.')],
      };
    }

    case "qualification.scoreSubmitted": {
      const submittedScore = event.payload;

      const existingScore = state.scores.find(
        (score) =>
          score.participantId === submittedScore.participantId &&
          score.judgeId === submittedScore.judgeId,
      );

      if (existingScore) {
        return {
          ...state,
          scores: state.scores.map((score) =>
            score.id === existingScore.id
              ? {
                  ...score,
                  score: submittedScore.score,
                }
              : score,
          ),
        };
      }

      return {
        ...state,
        scores: [...state.scores, submittedScore],
      };
    }

    case "qualification.finished": {
      return {
        ...state,
        event: updateBattleConfigurationStatus(state, "qualification_finished"),
        qualificationTimer: createIdleQualificationTimer(
          state.event.battleConfiguration?.qualificationDurationSeconds ?? 60,
        ),
        systemLogs: [...state.systemLogs, logEntry('Qualification finished.')],
      };
    }

    case "bracket.generated": {
      const activeBattleConfigurationId = getActiveBattleConfigurationId(state.event);
      const nextBattleConfiguration = state.event.battleConfiguration
        ? {
            ...state.event.battleConfiguration,
            status: "battle" as const,
            format: event.payload.format,
          }
        : state.event.battleConfiguration;
      const nextBattles = event.payload.battles.map((battle) => ({
        ...battle,
        battleConfigurationId: battle.battleConfigurationId ?? activeBattleConfigurationId ?? undefined,
      }));
      const nextBattleIds = new Set(nextBattles.map((battle) => battle.id));

      return {
        ...state,
        event: {
          ...state.event,
          status: "battle",
          battleConfiguration: nextBattleConfiguration,
          battleConfigurations: nextBattleConfiguration
            ? (state.event.battleConfigurations ?? []).map((configuration) =>
                configuration.id === nextBattleConfiguration.id
                  ? nextBattleConfiguration
                  : configuration,
              )
            : state.event.battleConfigurations,
        },
        battles: [
          ...state.battles.filter(
            (battle) =>
              battle.battleConfigurationId !== activeBattleConfigurationId &&
              !nextBattleIds.has(battle.id),
          ),
          ...nextBattles,
        ],
        votes: state.votes.filter((vote) =>
          state.battles.some(
            (battle) =>
              battle.id === vote.battleId &&
              battle.battleConfigurationId !== activeBattleConfigurationId,
          ),
        ),
        activeBattleId: null,
        systemLogs: [...state.systemLogs, logEntry('Battle bracket generated.')],
      };
    }

    case "battle.started": {
      return {
        ...state,
        activeBattleId: event.payload.battleId,
        battles: state.battles.map((battle) =>
          battle.id === event.payload.battleId
            ? {
                ...battle,
                status: "active",
              }
            : battle,
        ),
        systemLogs: [...state.systemLogs, logEntry(`Battle ${event.payload.battleId} started.`)],
      };
    }

    case "battle.votingOpened": {
      return {
        ...state,
        battles: state.battles.map((battle) =>
          battle.id === event.payload.battleId
            ? { ...battle, status: "voting" }
            : battle,
        ),
        systemLogs: [
          ...state.systemLogs,
          logEntry(`Voting opened for battle ${event.payload.battleId}.`),
        ],
      };
    }

    case "battle.voteSubmitted": {
      const submittedVote = event.payload;

      const existingVote = state.votes.find(
        (vote) =>
          vote.battleId === submittedVote.battleId &&
          vote.judgeId === submittedVote.judgeId,
      );

      if (existingVote) {
        return {
          ...state,
          votes: state.votes.map((vote) =>
            vote.id === existingVote.id
              ? {
                  ...vote,
                  winnerId: submittedVote.winnerId,
                }
              : vote,
          ),
          battles: state.battles.map((battle) =>
            battle.id === submittedVote.battleId
              ? {
                  ...battle,
                  status: "voting",
                }
              : battle,
          ),
        };
      }

      return {
        ...state,
        votes: [...state.votes, submittedVote],
        battles: state.battles.map((battle) =>
          battle.id === submittedVote.battleId
            ? {
                ...battle,
                status: "voting",
              }
            : battle,
        ),
      };
    }

    case "battle.finished": {
      return {
        ...state,
        activeBattleId:
          state.activeBattleId === event.payload.battleId
            ? null
            : state.activeBattleId,
        battles: state.battles.map((battle) =>
          battle.id === event.payload.battleId
            ? {
                ...battle,
                status: "finished",
                winnerId: event.payload.winnerId,
              }
            : battle,
        ),
        systemLogs: [...state.systemLogs, logEntry(`Battle finished. Winner: ${event.payload.winnerId}.`)],
      };
    }

    case "nextRound.generated": {
      return {
        ...state,
        battles: [...state.battles, ...event.payload.battles],
        activeBattleId: null,
      };
    }

    case "qualification.participantChanged": {
      return {
        ...state,
        currentQualificationParticipantIndex: event.payload.participantIndex,
        qualificationTimer:
          event.payload.timer ?? state.qualificationTimer,
      };
    }

    case "qualification.participantAdvanced": {
      return {
        ...state,
        currentQualificationParticipantIndex: event.payload.participantIndex,
        qualificationTimer: event.payload.timer,
        systemLogs: [
          ...state.systemLogs,
          logEntry(
            `Qualification advanced (${event.payload.reason}) to participant ${event.payload.participantIndex + 1}.`,
          ),
        ],
      };
    }

    case "qualification.timerPaused":
    case "qualification.timerResumed":
    case "qualification.timerRestarted":
    case "qualification.timerExpired": {
      return {
        ...state,
        qualificationTimer: event.payload.timer,
      };
    }

    case "participant.added": {
      const participant = {
        ...event.payload.participant,
        battleConfigurationId:
          event.payload.participant.battleConfigurationId ??
          state.event.activeBattleConfigurationId ??
          state.event.battleConfiguration?.id,
      };

      return {
        ...state,
        participants: [...state.participants, participant],
        systemLogs: [...state.systemLogs, logEntry(`Participant "${participant.name}" added.`)],
      };
    }

    case "participant.removed": {
      return {
        ...state,
        participants: state.participants.filter(p => p.id !== event.payload.participantId),
        systemLogs: [...state.systemLogs, logEntry(`Participant ${event.payload.participantId} removed.`)],
      };
    }

    case "participant.checkInToggled": {
      return {
        ...state,
        participants: state.participants.map(p =>
          p.id === event.payload.participantId
            ? { ...p, checkIn: event.payload.checkIn }
            : p,
        ),
      };
    }

    default: {
      return state;
    }
  }
}
