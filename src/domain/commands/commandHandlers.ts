import { calculateBattleWinner } from '../battle/calculateBattleWinner';
import { generateNextRound } from '../battle/advanceWinner';
import { generateBracketFromParticipantIds } from '../bracket/generateBracket';
import { calculateRanking } from '../qualification/calculateRanking';
import { AppEvent } from '../sync/appEvent';
import { createAppEvent } from '../sync/createAppEvent';
import { BattleAppState } from '../sync/appState';
import {
  getActiveBattleConfigurationId,
  getQualificationParticipants,
  isInBattleConfiguration,
} from '../sync/stateSelectors';
import { createId } from '../../shared/lib/createId';
import { AppCommand } from './command';
import {
  commandFailure,
  CommandHandlerResult,
  commandSuccess,
} from './commandResult';
import { BattleConfiguration, BattleFormat, DanceEvent } from '../event/types';
import { Judge } from '../judge/types';
import { CheckInStatus, Participant } from '../participant/types';
import { QualificationScore, QualificationTimerState } from '../qualification/types';

export function handleCommand(
  state: BattleAppState,
  command: AppCommand,
): CommandHandlerResult {
  switch (command.type) {
    case 'event.reset':
      return handleResetEventCommand();

    case 'qualification.start':
      return handleStartQualificationCommand(state, command);

    case 'qualification.submitScore':
      return handleSubmitQualificationScoreCommand(state, command);

    case 'qualification.goToNextParticipant':
      return handleAdvanceQualificationParticipantCommand(state, {
        ...command,
        type: 'qualification.advanceParticipant',
        payload: { reason: 'manual' },
      });

    case 'qualification.advanceParticipant':
      return handleAdvanceQualificationParticipantCommand(state, command);

    case 'qualification.markParticipantAbsent':
      return handleMarkQualificationParticipantAbsentCommand(state, command);

    case 'qualification.moveParticipantToEnd':
      return handleMoveQualificationParticipantToEndCommand(state, command);

    case 'qualification.timer.pause':
      return handlePauseQualificationTimerCommand(state, command);

    case 'qualification.timer.resume':
      return handleResumeQualificationTimerCommand(state, command);

    case 'qualification.timer.restart':
      return handleRestartQualificationTimerCommand(state, command);

    case 'qualification.timer.expire':
      return handleExpireQualificationTimerCommand(state, command);

    case 'qualification.finish':
      return handleFinishQualificationCommand(state);

    case 'bracket.generate':
      return handleGenerateBracketCommand(state, command);

    case 'battle.start':
      return handleStartBattleCommand(state, command);

    case 'battle.openVoting':
      return handleOpenBattleVotingCommand(state, command);

    case 'battle.submitVote':
      return handleSubmitBattleVoteCommand(state, command);

    case 'battle.generateNextRound':
      return handleGenerateNextRoundCommand(state);

    case 'event.create':
      return handleCreateEventCommand(state, command);

    case 'event.finish':
      return handleFinishEventCommand(state);

    case 'battle.configure':
      return handleConfigureBattleCommand(state, command);

    case 'battle.selectConfiguration':
      return handleSelectBattleConfigurationCommand(state, command);

    case 'battle.deleteConfiguration':
      return handleDeleteBattleConfigurationCommand(state, command);

    case 'battle.assignJudge':
      return handleAssignBattleJudgeCommand(state, command);

    case 'battle.unassignJudge':
      return handleUnassignBattleJudgeCommand(state, command);

    case 'battle.renameJudge':
      return handleRenameBattleJudgeCommand(state, command);

    case 'participant.add':
      return handleAddParticipantCommand(state, command);

    case 'participant.import':
      return handleImportParticipantsCommand(state, command);

    case 'participant.remove':
      return handleRemoveParticipantCommand(state, command);

    case 'participant.toggleCheckIn':
      return handleToggleParticipantCheckInCommand(state, command);

    default:
      return commandFailure('action_not_allowed', 'Unknown command');
  }
}

function getActiveBattleJudges(state: BattleAppState): Judge[] {
  const assignedJudgeIds =
    state.event.battleConfiguration?.assignedJudgeIds ?? [];

  if (assignedJudgeIds.length === 0) {
    return [];
  }

  return state.judges.filter((judge) => assignedJudgeIds.includes(judge.id));
}

function getActiveBattleParticipants(state: BattleAppState): Participant[] {
  return getQualificationParticipants(state);
}

function getActiveBattleScores(state: BattleAppState): QualificationScore[] {
  const activeParticipantIds = new Set(
    getActiveBattleParticipants(state).map((p) => p.id),
  );
  const activeJudgeIds = new Set(
    getActiveBattleJudges(state).map((j) => j.id),
  );

  return state.scores.filter(
    (score) =>
      activeParticipantIds.has(score.participantId) &&
      activeJudgeIds.has(score.judgeId),
  );
}

function getActiveBattles(state: BattleAppState): BattleAppState['battles'] {
  const configId = getActiveBattleConfigurationId(state.event);
  return state.battles.filter((b) => isInBattleConfiguration(configId, b));
}

const BRACKET_FORMAT_SIZE: Record<BattleFormat, number> = {
  top8: 8,
  top16: 16,
  top32: 32,
};

function getBattleConfiguration(
  state: BattleAppState,
  battleConfigurationId: string,
): BattleConfiguration | null {
  return (
    state.event.battleConfigurations.find(
      (item) => item.id === battleConfigurationId,
    ) ??
    (state.event.battleConfiguration?.id === battleConfigurationId
      ? state.event.battleConfiguration
      : null)
  );
}

function getConfigurationParticipants(
  state: BattleAppState,
  battleConfigurationId: string,
): Participant[] {
  return state.participants.filter((participant) =>
    isInBattleConfiguration(battleConfigurationId, participant),
  );
}

function getConfigurationJudges(
  state: BattleAppState,
  configuration: BattleConfiguration,
): Judge[] {
  return state.judges.filter((judge) =>
    configuration.assignedJudgeIds.includes(judge.id),
  );
}

function getConfigurationScores(
  state: BattleAppState,
  battleConfigurationId: string,
): QualificationScore[] {
  const participantIds = new Set(
    getConfigurationParticipants(state, battleConfigurationId).map(
      (participant) => participant.id,
    ),
  );

  return state.scores.filter((score) =>
    participantIds.has(score.participantId),
  );
}

function getConfigurationBattles(
  state: BattleAppState,
  battleConfigurationId: string,
): BattleAppState['battles'] {
  return state.battles.filter((battle) =>
    isInBattleConfiguration(battleConfigurationId, battle),
  );
}

function getConfigurationVotes(
  state: BattleAppState,
  battleConfigurationId: string,
): BattleAppState['votes'] {
  const battleIds = new Set(
    getConfigurationBattles(state, battleConfigurationId).map(
      (battle) => battle.id,
    ),
  );

  return state.votes.filter((vote) => battleIds.has(vote.battleId));
}

function hasActiveTimerForConfiguration(
  state: BattleAppState,
  battleConfigurationId: string,
): boolean {
  const timer = state.qualificationTimer;

  if (timer.status === 'idle') {
    return false;
  }

  const activeConfigurationId = getActiveBattleConfigurationId(state.event);

  if (activeConfigurationId === battleConfigurationId) {
    return true;
  }

  if (timer.participantId === null) {
    return false;
  }

  return getConfigurationParticipants(state, battleConfigurationId).some(
    (participant) => participant.id === timer.participantId,
  );
}

function hasBattleConfigurationData(
  state: BattleAppState,
  battleConfigurationId: string,
): boolean {
  return (
    getConfigurationScores(state, battleConfigurationId).length > 0 ||
    getConfigurationBattles(state, battleConfigurationId).length > 0 ||
    getConfigurationVotes(state, battleConfigurationId).length > 0 ||
    hasActiveTimerForConfiguration(state, battleConfigurationId)
  );
}

function hasStartedConfiguration(
  state: BattleAppState,
  configuration: BattleConfiguration,
): boolean {
  return configuration.status !== 'draft' ||
    hasBattleConfigurationData(state, configuration.id);
}

function ensureConfigurationCanMutateParticipants(
  state: BattleAppState,
  battleConfigurationId: string,
): CommandHandlerResult | null {
  const configuration = getBattleConfiguration(state, battleConfigurationId);

  if (!configuration) {
    return commandFailure('not_found', 'Battle configuration was not found');
  }

  if (hasStartedConfiguration(state, configuration)) {
    return commandFailure(
      'action_not_allowed',
      'Participants cannot be changed after qualification has started',
    );
  }

  return null;
}

function normalizeNameKey(name: string): string {
  return name.trim().toLocaleLowerCase();
}

function createStateForBattle(
  state: BattleAppState,
  battle: BattleAppState['battles'][number],
): BattleAppState {
  const battleConfigurationId = battle.battleConfigurationId;

  if (!battleConfigurationId) {
    return state;
  }

  const configuration = state.event.battleConfigurations.find(
    (item) => item.id === battleConfigurationId,
  );

  if (!configuration) {
    return state;
  }

  return {
    ...state,
    event: {
      ...state.event,
      battleConfiguration: configuration,
      activeBattleConfigurationId: configuration.id,
      status: configuration.status,
    },
  };
}

function handleResetEventCommand(): CommandHandlerResult {
  return commandSuccess([createAppEvent('event.reset', {})]);
}

function handleStartQualificationCommand(
  state: BattleAppState,
  command: Extract<AppCommand, { type: 'qualification.start' }>,
): CommandHandlerResult {
  const battleConfigurationId = command.payload.battleConfigurationId;
  const configuration = battleConfigurationId
    ? state.event.battleConfigurations.find(
        (item) => item.id === battleConfigurationId,
      )
    : state.event.battleConfiguration;

  if (battleConfigurationId && !configuration) {
    return commandFailure('not_found', 'Battle configuration was not found');
  }

  const commandState = battleConfigurationId && configuration
    ? {
        ...state,
        event: {
          ...state.event,
          battleConfiguration: configuration,
          activeBattleConfigurationId: configuration.id,
          status: configuration.status,
        },
      }
    : state;

  if (commandState.event.status !== 'draft') {
    return commandFailure(
      'invalid_status',
      'Qualification can be started only from draft status',
    );
  }

  if (!commandState.event.battleConfiguration) {
    return commandFailure(
      'not_enough_data',
      'Battle must be configured before qualification starts',
    );
  }

  const judges = getActiveBattleJudges(commandState);

  if (judges.length === 0) {
    return commandFailure(
      'not_enough_data',
      'At least one assigned judge is required to start qualification',
    );
  }

  const participants = getActiveBattleParticipants(commandState);
  const firstParticipant = participants[0];

  if (!firstParticipant) {
    return commandFailure(
      'not_enough_data',
      'At least one present participant is required to start qualification',
    );
  }

  const events: AppEvent[] = [];

  if (
    battleConfigurationId &&
    state.event.activeBattleConfigurationId !== battleConfigurationId
  ) {
    events.push(
      createAppEvent('battle.configurationSelected', {
        battleConfigurationId,
      }),
    );
  }

  events.push(
    createAppEvent('qualification.started', {
      currentParticipantIndex: 0,
      timer: createRunningQualificationTimer(
        firstParticipant.id,
        commandState.event.battleConfiguration.qualificationDurationSeconds,
        command.createdAt,
      ),
    }),
  );

  return commandSuccess(events);
}

function handleSubmitQualificationScoreCommand(
  state: BattleAppState,
  command: Extract<AppCommand, { type: 'qualification.submitScore' }>,
): CommandHandlerResult {
  if (state.event.status !== 'qualification') {
    return commandFailure(
      'invalid_status',
      'Score can be submitted only during qualification',
    );
  }

  const { participantId, judgeId, score } = command.payload;

  const participantExists = getActiveBattleParticipants(state).some(
    (participant) => participant.id === participantId,
  );

  if (!participantExists) {
    return commandFailure('not_found', 'Participant was not found');
  }

  const judgeExists = getActiveBattleJudges(state).some(
    (judge) => judge.id === judgeId,
  );

  if (!judgeExists) {
    return commandFailure('not_found', 'Judge was not found');
  }

  if (score < 1 || score > 10) {
    return commandFailure('invalid_score', 'Score should be between 1 and 10');
  }

  return commandSuccess([
    createAppEvent('qualification.scoreSubmitted', {
      id: createId('score'),
      participantId,
      judgeId,
      score,
      createdAt: new Date().toISOString(),
    }),
  ]);
}

function handleAdvanceQualificationParticipantCommand(
  state: BattleAppState,
  command: Extract<AppCommand, { type: 'qualification.advanceParticipant' }>,
): CommandHandlerResult {
  if (state.event.status !== 'qualification') {
    return commandFailure(
      'invalid_status',
      'Participant can be changed only during qualification',
    );
  }

  const participants = getActiveBattleParticipants(state);
  const isLastParticipant =
    state.currentQualificationParticipantIndex >= participants.length - 1;

  if (isLastParticipant) {
    return commandFailure(
      'action_not_allowed',
      'Current participant is the last participant',
    );
  }

  const currentParticipant =
    participants[state.currentQualificationParticipantIndex];

  if (!currentParticipant) {
    return commandFailure('not_found', 'Current participant was not found');
  }

  if (
    command.payload.participantId !== undefined &&
    command.payload.participantId !== currentParticipant.id
  ) {
    return commandFailure(
      'action_not_allowed',
      'Timer is no longer active for this participant',
    );
  }

  const judges = getActiveBattleJudges(state);
  const currentParticipantScores = getActiveBattleScores(state).filter(
    (score) => score.participantId === currentParticipant.id,
  );
  const scoredJudgeIds = new Set(
    currentParticipantScores.map((score) => score.judgeId),
  );

  if (scoredJudgeIds.size < judges.length) {
    return commandFailure(
      'action_not_allowed',
      'All judges should score the current participant before moving next',
    );
  }

  const nextParticipantIndex = state.currentQualificationParticipantIndex + 1;
  const nextParticipant = participants[nextParticipantIndex];

  if (!nextParticipant) {
    return commandFailure('not_found', 'Next participant was not found');
  }

  return commandSuccess([
    createAppEvent('qualification.participantAdvanced', {
      participantIndex: nextParticipantIndex,
      reason: command.payload.reason,
      timer: createRunningQualificationTimer(
        nextParticipant.id,
        state.event.battleConfiguration?.qualificationDurationSeconds ?? 60,
        command.createdAt,
      ),
    }),
  ]);
}

function getCurrentQualificationParticipant(
  state: BattleAppState,
): Participant | null {
  return (
    getActiveBattleParticipants(state)[state.currentQualificationParticipantIndex] ??
    null
  );
}

function validateCurrentQualificationParticipant(
  state: BattleAppState,
  participantId: string,
): CommandHandlerResult | Participant {
  if (state.event.status !== 'qualification') {
    return commandFailure(
      'invalid_status',
      'Participant can be changed only during qualification',
    );
  }

  const currentParticipant = getCurrentQualificationParticipant(state);

  if (!currentParticipant) {
    return commandFailure('not_found', 'Current participant was not found');
  }

  if (participantId !== currentParticipant.id) {
    return commandFailure(
      'action_not_allowed',
      'Command participant no longer matches the current qualification participant',
    );
  }

  return currentParticipant;
}

function handleMarkQualificationParticipantAbsentCommand(
  state: BattleAppState,
  command: Extract<AppCommand, { type: 'qualification.markParticipantAbsent' }>,
): CommandHandlerResult {
  const currentParticipantOrError = validateCurrentQualificationParticipant(
    state,
    command.payload.participantId,
  );

  if ('events' in currentParticipantOrError) {
    return currentParticipantOrError;
  }

  const judges = getActiveBattleJudges(state);

  if (judges.length === 0) {
    return commandFailure(
      'not_enough_data',
      'At least one assigned judge is required to mark participant absent',
    );
  }

  return commandSuccess(
    judges.map((judge) =>
      createAppEvent('qualification.scoreSubmitted', {
        id: createId('score'),
        participantId: currentParticipantOrError.id,
        judgeId: judge.id,
        score: 0,
        createdAt: command.createdAt,
      }),
    ),
  );
}

function handleMoveQualificationParticipantToEndCommand(
  state: BattleAppState,
  command: Extract<AppCommand, { type: 'qualification.moveParticipantToEnd' }>,
): CommandHandlerResult {
  const currentParticipantOrError = validateCurrentQualificationParticipant(
    state,
    command.payload.participantId,
  );

  if ('events' in currentParticipantOrError) {
    return currentParticipantOrError;
  }

  const participants = getActiveBattleParticipants(state);
  const currentIndex = state.currentQualificationParticipantIndex;

  if (currentIndex >= participants.length - 1) {
    return commandFailure(
      'action_not_allowed',
      'Current participant is the last participant',
    );
  }

  const nextParticipant = participants[currentIndex + 1];

  if (!nextParticipant) {
    return commandFailure('not_found', 'Next participant was not found');
  }

  return commandSuccess([
    createAppEvent('qualification.participantMovedToEnd', {
      participantId: currentParticipantOrError.id,
      participantIndex: currentIndex,
      timer: createRunningQualificationTimer(
        nextParticipant.id,
        state.event.battleConfiguration?.qualificationDurationSeconds ?? 60,
        command.createdAt,
      ),
    }),
  ]);
}

function handlePauseQualificationTimerCommand(
  state: BattleAppState,
  command: Extract<AppCommand, { type: 'qualification.timer.pause' }>,
): CommandHandlerResult {
  if (state.event.status !== 'qualification') {
    return commandFailure(
      'invalid_status',
      'Timer can be paused only during qualification',
    );
  }

  const timer = state.qualificationTimer;

  if (timer.status !== 'running' || timer.endsAt === null) {
    return commandFailure('action_not_allowed', 'Timer is not running');
  }

  return commandSuccess([
    createAppEvent('qualification.timerPaused', {
      timer: {
        ...timer,
        status: 'paused',
        endsAt: null,
        remainingMsWhenPaused: Math.max(
          0,
          Date.parse(timer.endsAt) - Date.parse(command.createdAt),
        ),
      },
    }),
  ]);
}

function handleResumeQualificationTimerCommand(
  state: BattleAppState,
  command: Extract<AppCommand, { type: 'qualification.timer.resume' }>,
): CommandHandlerResult {
  if (state.event.status !== 'qualification') {
    return commandFailure(
      'invalid_status',
      'Timer can be resumed only during qualification',
    );
  }

  const timer = state.qualificationTimer;

  if (
    timer.status !== 'paused' ||
    timer.participantId === null ||
    timer.remainingMsWhenPaused === null
  ) {
    return commandFailure('action_not_allowed', 'Timer is not paused');
  }

  return commandSuccess([
    createAppEvent('qualification.timerResumed', {
      timer: {
        ...timer,
        status: 'running',
        endsAt: new Date(
          Date.parse(command.createdAt) + timer.remainingMsWhenPaused,
        ).toISOString(),
        remainingMsWhenPaused: null,
      },
    }),
  ]);
}

function handleRestartQualificationTimerCommand(
  state: BattleAppState,
  command: Extract<AppCommand, { type: 'qualification.timer.restart' }>,
): CommandHandlerResult {
  if (state.event.status !== 'qualification') {
    return commandFailure(
      'invalid_status',
      'Timer can be restarted only during qualification',
    );
  }

  const currentParticipant =
    getActiveBattleParticipants(state)[state.currentQualificationParticipantIndex];

  if (!currentParticipant) {
    return commandFailure('not_found', 'Current participant was not found');
  }

  return commandSuccess([
    createAppEvent('qualification.timerRestarted', {
      timer: createRunningQualificationTimer(
        currentParticipant.id,
        state.event.battleConfiguration?.qualificationDurationSeconds ?? 60,
        command.createdAt,
      ),
    }),
  ]);
}

function handleExpireQualificationTimerCommand(
  state: BattleAppState,
  command: Extract<AppCommand, { type: 'qualification.timer.expire' }>,
): CommandHandlerResult {
  if (state.event.status !== 'qualification') {
    return commandFailure(
      'invalid_status',
      'Timer can expire only during qualification',
    );
  }

  const timer = state.qualificationTimer;

  if (
    timer.status !== 'running' ||
    timer.participantId !== command.payload.participantId
  ) {
    return commandFailure(
      'action_not_allowed',
      'Timer is not running for this participant',
    );
  }

  return commandSuccess([
    createAppEvent('qualification.timerExpired', {
      timer: {
        ...timer,
        status: 'expired',
        endsAt: null,
        remainingMsWhenPaused: null,
      },
    }),
  ]);
}

function handleFinishQualificationCommand(
  state: BattleAppState,
): CommandHandlerResult {
  if (state.event.status !== 'qualification') {
    return commandFailure(
      'invalid_status',
      'Qualification can be finished only from qualification status',
    );
  }

  const judges = getActiveBattleJudges(state);
  const participants = getActiveBattleParticipants(state);
  const activeScores = getActiveBattleScores(state);

  if (judges.length === 0 || participants.length === 0) {
    return commandFailure(
      'not_enough_data',
      'Qualification needs participants and assigned judges',
    );
  }

  const hasAllRequiredScores = participants.every((participant) =>
    judges.every((judge) =>
      activeScores.some(
        (score) =>
          score.participantId === participant.id &&
          score.judgeId === judge.id,
      ),
    ),
  );

  if (!hasAllRequiredScores) {
    return commandFailure(
      'not_enough_data',
      'All participants should receive scores from all judges',
    );
  }

  return commandSuccess([createAppEvent('qualification.finished', {})]);
}

function handleGenerateBracketCommand(
  state: BattleAppState,
  command: Extract<AppCommand, { type: 'bracket.generate' }>,
): CommandHandlerResult {
  if (state.event.status !== 'qualification_finished') {
    return commandFailure(
      'invalid_status',
      'Bracket can be generated only after qualification is finished',
    );
  }

  const activeBattleConfigurationId = getActiveBattleConfigurationId(state.event);
  const activeConfiguration = activeBattleConfigurationId
    ? getBattleConfiguration(state, activeBattleConfigurationId)
    : null;
  const activeBattles = getActiveBattles(state);

  if (!activeBattleConfigurationId || !activeConfiguration) {
    return commandFailure('not_enough_data', 'Battle configuration was not found');
  }

  if (activeBattles.length > 0) {
    return commandFailure(
      'action_not_allowed',
      'Bracket has already been generated',
    );
  }

  const judges = getActiveBattleJudges(state);
  const participants = getActiveBattleParticipants(state);
  const activeScores = getActiveBattleScores(state);
  const hasAllRequiredScores =
    judges.length > 0 &&
    participants.length > 0 &&
    participants.every((participant) =>
      judges.every((judge) =>
        activeScores.some(
          (score) =>
            score.participantId === participant.id &&
            score.judgeId === judge.id,
        ),
      ),
    );

  if (!hasAllRequiredScores) {
    return commandFailure(
      'not_enough_data',
      'Not enough qualification scores to generate the bracket',
    );
  }

  const participantIds = command.payload.participantIds;
  const uniqueParticipantIds = new Set(participantIds);

  if (participantIds.length < 2) {
    return commandFailure('not_enough_data', 'At least 2 participants are required for bracket');
  }

  if (participantIds.length > 32) {
    return commandFailure(
      'not_enough_data',
      'Bracket can include at most 32 participants',
    );
  }

  if (uniqueParticipantIds.size !== participantIds.length) {
    return commandFailure(
      'action_not_allowed',
      'Bracket participant IDs should be unique',
    );
  }

  if (
    activeConfiguration.format !== null &&
    participantIds.length !== BRACKET_FORMAT_SIZE[activeConfiguration.format]
  ) {
    return commandFailure(
      'not_enough_data',
      `${activeConfiguration.format.toUpperCase()} bracket requires ${BRACKET_FORMAT_SIZE[activeConfiguration.format]} participants`,
    );
  }

  const activeParticipantIds = new Set(
    participants.map((participant) => participant.id),
  );
  const missingOrOutOfScopeParticipant = participantIds.find(
    (participantId) => !activeParticipantIds.has(participantId),
  );

  if (missingOrOutOfScopeParticipant) {
    return commandFailure(
      'not_found',
      'Bracket participants should belong to the active battle configuration',
    );
  }

  const ranking = calculateRanking({
    participants,
    scores: activeScores,
  });

  const selectedParticipantSet = new Set(participantIds);
  const selectedParticipantIds = ranking.map((item) => item.participantId).filter(
    (participantId) => selectedParticipantSet.has(participantId),
  );

  if (selectedParticipantIds.length !== participantIds.length) {
    return commandFailure(
      'not_found',
      'Bracket participants should be selected from qualification ranking',
    );
  }

  const battles = generateBracketFromParticipantIds(selectedParticipantIds).map(
    (battle) => ({
      ...battle,
      battleConfigurationId: activeBattleConfigurationId ?? undefined,
    }),
  );

  return commandSuccess([
    createAppEvent('bracket.generated', {
      format: null,
      battles,
    }),
  ]);
}

function handleStartBattleCommand(
  state: BattleAppState,
  command: Extract<AppCommand, { type: 'battle.start' }>,
): CommandHandlerResult {
  const battle = state.battles.find(
    (item) => item.id === command.payload.battleId,
  );

  if (!battle) {
    return commandFailure('not_found', 'Battle was not found');
  }

  const commandState = createStateForBattle(state, battle);

  if (commandState.event.status !== 'battle') {
    return commandFailure(
      'invalid_status',
      'Battle can be started only during battle stage',
    );
  }

  if (!isInBattleConfiguration(getActiveBattleConfigurationId(commandState.event), battle)) {
    return commandFailure('action_not_allowed', 'Battle is not part of the active category');
  }

  if (battle.status === 'finished') {
    return commandFailure('already_finished', 'Battle is already finished');
  }

  if (battle.status !== 'pending') {
    return commandFailure(
      'action_not_allowed',
      'Only pending battle can be started',
    );
  }

  return commandSuccess([
    createAppEvent('battle.started', {
      battleId: battle.id,
    }),
  ]);
}

function handleOpenBattleVotingCommand(
  state: BattleAppState,
  command: Extract<AppCommand, { type: 'battle.openVoting' }>,
): CommandHandlerResult {
  const battle = state.battles.find(b => b.id === command.payload.battleId);

  if (!battle) {
    return commandFailure('not_found', 'Battle not found');
  }

  const commandState = createStateForBattle(state, battle);

  if (commandState.event.status !== 'battle') {
    return commandFailure(
      'invalid_status',
      'Voting can be opened only during battle stage',
    );
  }

  if (!isInBattleConfiguration(getActiveBattleConfigurationId(commandState.event), battle)) {
    return commandFailure('action_not_allowed', 'Battle is not part of the active category');
  }

  if (battle.status !== 'active') {
    return commandFailure(
      'action_not_allowed',
      'Only active battles can open voting',
    );
  }

  return commandSuccess([
    createAppEvent('battle.votingOpened', { battleId: battle.id }),
  ]);
}

function handleSubmitBattleVoteCommand(
  state: BattleAppState,
  command: Extract<AppCommand, { type: 'battle.submitVote' }>,
): CommandHandlerResult {
  const { battleId, judgeId, winnerId } = command.payload;

  const battle = state.battles.find((item) => item.id === battleId);

  if (!battle) {
    return commandFailure('not_found', 'Battle was not found');
  }

  const commandState = createStateForBattle(state, battle);

  if (commandState.event.status !== 'battle') {
    return commandFailure(
      'invalid_status',
      'Vote can be submitted only during battle stage',
    );
  }

  if (!isInBattleConfiguration(getActiveBattleConfigurationId(commandState.event), battle)) {
    return commandFailure('action_not_allowed', 'Battle is not part of the active category');
  }

  if (battle.status === 'finished') {
    return commandFailure('already_finished', 'Battle is already finished');
  }

  if (battle.status !== 'voting') {
    return commandFailure(
      'action_not_allowed',
      'Voting must be opened before submitting a vote',
    );
  }

  const activeJudges = getActiveBattleJudges(commandState);
  const judgeExists = activeJudges.some((judge) => judge.id === judgeId);

  if (!judgeExists) {
    return commandFailure('not_found', 'Judge was not found');
  }

  const battleParticipantIds = battle.participantIds ?? [
    battle.participantAId,
    battle.participantBId,
  ];
  const isValidWinner = battleParticipantIds.includes(winnerId);

  if (!isValidWinner) {
    return commandFailure(
      'invalid_winner',
      'Vote winner should be one of battle participants',
    );
  }

  const voteSubmittedEvent = createAppEvent('battle.voteSubmitted', {
    id: createId('vote'),
    battleId,
    judgeId,
    winnerId,
    createdAt: new Date().toISOString(),
  });

  const nextVotes = applyVoteToVotesList(state.votes, voteSubmittedEvent.payload);

  const currentBattleVotes = nextVotes.filter(
    (vote) => vote.battleId === battleId,
  );

  const allJudgesVoted = currentBattleVotes.length === activeJudges.length;

  const events: AppEvent[] = [voteSubmittedEvent];

  if (!allJudgesVoted) {
    return commandSuccess(events);
  }

  const calculatedWinnerId = calculateBattleWinner({
    votes: currentBattleVotes,
    judgesCount: activeJudges.length,
  });

  if (!calculatedWinnerId) {
    return commandSuccess(events);
  }

  events.push(
    createAppEvent('battle.finished', {
      battleId,
      winnerId: calculatedWinnerId,
    }),
  );

  return commandSuccess(events);
}

function handleGenerateNextRoundCommand(
  state: BattleAppState,
): CommandHandlerResult {
  if (state.event.status !== 'battle') {
    return commandFailure(
      'invalid_status',
      'Next round can be generated only during battle stage',
    );
  }

  const activeBattleConfigurationId = getActiveBattleConfigurationId(state.event);
  const activeBattles = getActiveBattles(state);
  const rounds = ['custom', 'top32', 'top16', 'top8', 'semifinal'] as const;
  const currentRound = [...rounds].reverse().find((round) =>
    activeBattles.some((battle) => battle.round === round),
  );

  if (currentRound) {
    const currentBattles = activeBattles.filter(
      (battle) => battle.round === currentRound,
    );
    const nextRoundExists = activeBattles.some(
      (battle) => battle.round !== currentRound &&
        rounds.indexOf(battle.round as typeof rounds[number]) > rounds.indexOf(currentRound),
    ) || activeBattles.some((battle) => battle.round === 'final');

    if (
      !nextRoundExists &&
      currentBattles.every((battle) => battle.status === 'finished')
    ) {
      return commandSuccess([
        createAppEvent('nextRound.generated', {
          battles: generateNextRound(currentBattles).map((battle) => ({
            ...battle,
            battleConfigurationId: activeBattleConfigurationId ?? undefined,
          })),
        }),
      ]);
    }
  }

  return commandFailure(
    'action_not_allowed',
    'Current round is not ready to generate next round',
  );
}

function handleCreateEventCommand(
  _state: BattleAppState,
  command: Extract<AppCommand, { type: 'event.create' }>,
): CommandHandlerResult {
  const { title } = command.payload;
  const newEvent: DanceEvent = {
    id: createId('event'),
    title,
    battleConfiguration: null,
    battleConfigurations: [],
    activeBattleConfigurationId: null,
    status: 'draft',
    createdAt: new Date().toISOString(),
  };
  return commandSuccess([createAppEvent('event.created', { event: newEvent })]);
}

function handleFinishEventCommand(
  state: BattleAppState,
): CommandHandlerResult {
  if (state.event.status === 'draft') {
    return commandFailure(
      'invalid_status',
      'Event cannot be finished before qualification starts',
    );
  }

  if (state.event.status === 'finished') {
    return commandFailure(
      'invalid_status',
      'Event is already finished',
    );
  }

  const startedConfigurations = state.event.battleConfigurations.filter(
    (configuration) => configuration.status !== 'draft',
  );
  const hasUnfinishedQualification = startedConfigurations.some(
    (configuration) =>
      configuration.status === 'qualification' ||
      configuration.status === 'qualification_finished',
  );

  if (
    state.event.status === 'qualification' ||
    state.event.status === 'qualification_finished' ||
    hasUnfinishedQualification
  ) {
    return commandFailure(
      'invalid_status',
      'Event cannot be finished before battles are complete',
    );
  }

  const hasOpenBattle = state.battles.some(
    (battle) => battle.status === 'active' || battle.status === 'voting',
  );

  if (hasOpenBattle) {
    return commandFailure(
      'action_not_allowed',
      'Event cannot be finished while a battle is active or voting',
    );
  }

  const hasFinalResult =
    startedConfigurations.length > 0 &&
    startedConfigurations.every((configuration) =>
      getConfigurationBattles(state, configuration.id).some(
        (battle) =>
          battle.round === 'final' &&
          battle.status === 'finished' &&
          battle.winnerId !== undefined,
      ),
    );

  if (
    startedConfigurations.some(
      (configuration) => configuration.status !== 'battle',
    )
  ) {
    return commandFailure(
      'invalid_status',
      'Event cannot be finished before all started battles are complete',
    );
  }

  const hasUnfinishedBattle = startedConfigurations.some((configuration) =>
    getConfigurationBattles(state, configuration.id).some(
      (battle) => battle.status !== 'finished' || battle.winnerId === undefined,
    ),
  );

  if (hasUnfinishedBattle) {
    return commandFailure(
      'action_not_allowed',
      'Event cannot be finished before all battles are finished',
    );
  }

  if (!hasFinalResult) {
    return commandFailure(
      'not_enough_data',
      'Event needs a final battle result before it can finish',
    );
  }

  return commandSuccess([createAppEvent('event.finished', {})]);
}

function handleConfigureBattleCommand(
  _state: BattleAppState,
  command: Extract<AppCommand, { type: 'battle.configure' }>,
): CommandHandlerResult {
  const {
    categoryTitle,
    qualificationAdvanceMode,
    qualificationDurationSeconds,
  } = command.payload;

  if (categoryTitle.trim().length === 0) {
    return commandFailure('not_enough_data', 'Battle category is required');
  }

  const configuration: BattleConfiguration = {
    id: createId('battle_config'),
    categoryTitle: categoryTitle.trim(),
    status: 'draft',
    format: null,
    assignedJudgeIds: [],
    qualificationDurationSeconds: normalizeQualificationDurationSeconds(
      qualificationDurationSeconds,
    ),
    qualificationAdvanceMode: qualificationAdvanceMode ?? 'manual',
  };

  return commandSuccess([
    createAppEvent('battle.configured', {
      configuration,
    }),
  ]);
}

function handleAssignBattleJudgeCommand(
  state: BattleAppState,
  command: Extract<AppCommand, { type: 'battle.assignJudge' }>,
): CommandHandlerResult {
  const battleConfigurationId =
    command.payload.battleConfigurationId ??
    state.event.activeBattleConfigurationId ??
    state.event.battleConfiguration?.id;

  if (!battleConfigurationId) {
    return commandFailure('not_enough_data', 'Battle is not configured');
  }

  const configuration = state.event.battleConfigurations.find(
    (item) => item.id === battleConfigurationId,
  ) ?? state.event.battleConfiguration;

  if (!configuration || configuration.id !== battleConfigurationId) {
    return commandFailure('not_found', 'Battle configuration was not found');
  }

  const name = command.payload.name.trim();

  if (name.length === 0) {
    return commandFailure('not_enough_data', 'Judge name is required');
  }

  const existingJudge = state.judges.find(
    (judge) => judge.deviceId === command.payload.deviceId,
  );

  const judge: Judge = existingJudge
    ? {
        ...existingJudge,
        name,
        battleConfigurationId:
          existingJudge.battleConfigurationId ?? battleConfigurationId,
      }
    : {
        id: createId('judge'),
        name,
        role: configuration.assignedJudgeIds.length === 0 ? 'head' : 'standard',
        deviceId: command.payload.deviceId,
        battleConfigurationId,
      };

  return commandSuccess([
    createAppEvent('battle.judgeAssigned', {
      battleConfigurationId,
      judge,
    }),
  ]);
}

function handleUnassignBattleJudgeCommand(
  state: BattleAppState,
  command: Extract<AppCommand, { type: 'battle.unassignJudge' }>,
): CommandHandlerResult {
  const battleConfigurationId =
    command.payload.battleConfigurationId ??
    state.event.activeBattleConfigurationId ??
    state.event.battleConfiguration?.id;

  if (!battleConfigurationId) {
    return commandFailure('not_enough_data', 'Battle is not configured');
  }

  const configuration = state.event.battleConfigurations.find(
    (item) => item.id === battleConfigurationId,
  ) ?? state.event.battleConfiguration;

  if (!configuration || configuration.id !== battleConfigurationId) {
    return commandFailure('not_found', 'Battle configuration was not found');
  }

  const judge = state.judges.find(
    (item) =>
      item.deviceId === command.payload.deviceId &&
      configuration.assignedJudgeIds.includes(item.id),
  );

  if (!judge) {
    return commandFailure('not_found', 'Assigned judge was not found');
  }

  return commandSuccess([
    createAppEvent('battle.judgeUnassigned', {
      battleConfigurationId,
      judgeId: judge.id,
      deviceId: command.payload.deviceId,
    }),
  ]);
}

function handleRenameBattleJudgeCommand(
  state: BattleAppState,
  command: Extract<AppCommand, { type: 'battle.renameJudge' }>,
): CommandHandlerResult {
  const name = command.payload.name.trim();

  if (name.length === 0) {
    return commandFailure('not_enough_data', 'Judge name is required');
  }

  const judge = state.judges.find(
    (item) => item.id === command.payload.judgeId,
  );

  if (!judge) {
    return commandFailure('not_found', 'Judge was not found');
  }

  return commandSuccess([
    createAppEvent('battle.judgeRenamed', {
      judgeId: judge.id,
      name,
    }),
  ]);
}

function handleSelectBattleConfigurationCommand(
  state: BattleAppState,
  command: Extract<AppCommand, { type: 'battle.selectConfiguration' }>,
): CommandHandlerResult {
  const configuration = state.event.battleConfigurations.find(
    (item) => item.id === command.payload.battleConfigurationId,
  );

  if (!configuration) {
    return commandFailure('not_found', 'Battle configuration was not found');
  }

  const activeBattleConfigurationId = getActiveBattleConfigurationId(state.event);
  const activeConfiguration = activeBattleConfigurationId
    ? getBattleConfiguration(state, activeBattleConfigurationId)
    : null;

  if (
    activeBattleConfigurationId !== null &&
    activeBattleConfigurationId !== configuration.id &&
    (state.event.status === 'qualification' ||
      state.event.status === 'battle' ||
      (activeConfiguration !== null &&
        (activeConfiguration.status === 'qualification' ||
          activeConfiguration.status === 'battle')) ||
      configuration.status === 'qualification' ||
      configuration.status === 'battle')
  ) {
    return commandFailure(
      'action_not_allowed',
      'Battle configuration cannot be switched while qualification or battles are in progress',
    );
  }

  return commandSuccess([
    createAppEvent('battle.configurationSelected', {
      battleConfigurationId: configuration.id,
    }),
  ]);
}

function handleDeleteBattleConfigurationCommand(
  state: BattleAppState,
  command: Extract<AppCommand, { type: 'battle.deleteConfiguration' }>,
): CommandHandlerResult {
  const configuration = state.event.battleConfigurations.find(
    (item) => item.id === command.payload.battleConfigurationId,
  );

  if (!configuration) {
    return commandFailure('not_found', 'Battle configuration was not found');
  }

  if (configuration.status !== 'draft') {
    return commandFailure(
      'action_not_allowed',
      'Only draft battle configurations can be deleted',
    );
  }

  if (hasBattleConfigurationData(state, configuration.id)) {
    return commandFailure(
      'action_not_allowed',
      'Battle configuration cannot be deleted after scores, battles, votes, or timer state exist',
    );
  }

  return commandSuccess([
    createAppEvent('battle.configurationDeleted', {
      battleConfigurationId: configuration.id,
    }),
  ]);
}

function handleAddParticipantCommand(
  state: BattleAppState,
  command: Extract<AppCommand, { type: 'participant.add' }>,
): CommandHandlerResult {
  const { name, number, crew, city } = command.payload;
  const normalizedName = name.trim();
  const battleConfigurationId =
    command.payload.battleConfigurationId ?? getActiveBattleConfigurationId(state.event);

  if (!battleConfigurationId) {
    return commandFailure('not_enough_data', 'Battle must be selected before adding participants');
  }

  const mutabilityError = ensureConfigurationCanMutateParticipants(
    state,
    battleConfigurationId,
  );

  if (mutabilityError) {
    return mutabilityError;
  }

  if (normalizedName.length === 0) {
    return commandFailure('not_enough_data', 'Participant name is required');
  }

  if (!Number.isInteger(number) || number <= 0) {
    return commandFailure('invalid_number', 'Participant number should be positive');
  }

  const existingParticipants = state.participants.filter(
    (p) => isInBattleConfiguration(battleConfigurationId, p),
  );

  if (existingParticipants.some(p => p.number === number)) {
    return commandFailure('invalid_number', 'Participant number already exists');
  }

  if (
    existingParticipants.some(
      (p) => normalizeNameKey(p.name) === normalizeNameKey(normalizedName),
    )
  ) {
    return commandFailure('action_not_allowed', 'Participant name already exists');
  }

  const participant: Participant = {
    id: createId('participant'),
    battleConfigurationId,
    number,
    name: normalizedName,
    crew: crew?.trim() || undefined,
    city: city?.trim() || undefined,
    checkIn: 'absent',
    status: 'registered',
  };
  return commandSuccess([createAppEvent('participant.added', { participant })]);
}

function handleImportParticipantsCommand(
  state: BattleAppState,
  command: Extract<AppCommand, { type: 'participant.import' }>,
): CommandHandlerResult {
  const defaultBattleConfigurationId = getActiveBattleConfigurationId(state.event);
  const importedParticipants = command.payload.participants.map(
    (participant) => ({
      ...participant,
      battleConfigurationId:
        participant.battleConfigurationId ?? defaultBattleConfigurationId,
      name: participant.name.trim(),
      crew: participant.crew?.trim() || undefined,
      city: participant.city?.trim() || undefined,
    }),
  );

  if (importedParticipants.length === 0) {
    return commandFailure('not_enough_data', 'No participants to import');
  }

  const invalidParticipant = importedParticipants.find(
    (participant) =>
      participant.name.length === 0 ||
      participant.battleConfigurationId === null ||
      participant.battleConfigurationId === undefined ||
      !Number.isInteger(participant.number) ||
      participant.number <= 0,
  );

  if (invalidParticipant) {
    return commandFailure(
      'not_enough_data',
      'Each imported participant needs a name and a positive number',
    );
  }

  const importBattleConfigurationId =
    importedParticipants[0]?.battleConfigurationId ?? defaultBattleConfigurationId;

  if (!importBattleConfigurationId) {
    return commandFailure('not_enough_data', 'Battle must be selected before importing participants');
  }

  const mixedConfiguration = importedParticipants.some(
    (participant) =>
      participant.battleConfigurationId !== importBattleConfigurationId,
  );

  if (mixedConfiguration) {
    return commandFailure(
      'action_not_allowed',
      'Imported participants should target one battle configuration',
    );
  }

  const mutabilityError = ensureConfigurationCanMutateParticipants(
    state,
    importBattleConfigurationId,
  );

  if (mutabilityError) {
    return mutabilityError;
  }

  const existingParticipants = state.participants.filter((p) =>
    isInBattleConfiguration(importBattleConfigurationId, p),
  );
  const existingNumbers = new Set(
    existingParticipants.map((p) => p.number),
  );
  const existingNames = new Set(
    existingParticipants.map((p) => normalizeNameKey(p.name)),
  );
  const importNumbers = new Set<number>();
  const importNames = new Set<string>();

  for (const participant of importedParticipants) {
    if (existingNumbers.has(participant.number)) {
      return commandFailure(
        'invalid_number',
        `Participant number ${participant.number} already exists`,
      );
    }

    if (importNumbers.has(participant.number)) {
      return commandFailure(
        'invalid_number',
        `Participant number ${participant.number} is duplicated in import`,
      );
    }

    importNumbers.add(participant.number);

    const nameKey = normalizeNameKey(participant.name);

    if (existingNames.has(nameKey)) {
      return commandFailure(
        'action_not_allowed',
        `Participant name "${participant.name}" already exists`,
      );
    }

    if (importNames.has(nameKey)) {
      return commandFailure(
        'action_not_allowed',
        `Participant name "${participant.name}" is duplicated in import`,
      );
    }

    importNames.add(nameKey);
  }

  return commandSuccess(
    importedParticipants.map((participant) =>
      createAppEvent('participant.added', {
        participant: {
          id: createId('participant'),
          battleConfigurationId: participant.battleConfigurationId ?? undefined,
          number: participant.number,
          name: participant.name,
          crew: participant.crew,
          city: participant.city,
          checkIn: 'absent',
          status: 'registered',
        },
      }),
    ),
  );
}

function handleRemoveParticipantCommand(
  state: BattleAppState,
  command: Extract<AppCommand, { type: 'participant.remove' }>,
): CommandHandlerResult {
  const { participantId } = command.payload;
  const participant = state.participants.find(p => p.id === participantId);

  if (!participant) {
    return commandFailure('not_found', 'Participant not found');
  }

  const battleConfigurationId =
    participant.battleConfigurationId ?? getActiveBattleConfigurationId(state.event);

  if (!battleConfigurationId) {
    return commandFailure('not_enough_data', 'Battle configuration was not found');
  }

  const mutabilityError = ensureConfigurationCanMutateParticipants(
    state,
    battleConfigurationId,
  );

  if (mutabilityError) {
    return mutabilityError;
  }

  return commandSuccess([createAppEvent('participant.removed', { participantId })]);
}

function handleToggleParticipantCheckInCommand(
  state: BattleAppState,
  command: Extract<AppCommand, { type: 'participant.toggleCheckIn' }>,
): CommandHandlerResult {
  const { participantId } = command.payload;
  const participant = state.participants.find(p => p.id === participantId);
  if (!participant) return commandFailure('not_found', 'Participant not found');

  const battleConfigurationId =
    participant.battleConfigurationId ?? getActiveBattleConfigurationId(state.event);

  if (!battleConfigurationId) {
    return commandFailure('not_enough_data', 'Battle configuration was not found');
  }

  const mutabilityError = ensureConfigurationCanMutateParticipants(
    state,
    battleConfigurationId,
  );

  if (mutabilityError) {
    return mutabilityError;
  }

  const checkIn: CheckInStatus = participant.checkIn === 'present' ? 'absent' : 'present';
  return commandSuccess([createAppEvent('participant.checkInToggled', { participantId, checkIn })]);
}

function applyVoteToVotesList(
  votes: BattleAppState['votes'],
  submittedVote: BattleAppState['votes'][number],
): BattleAppState['votes'] {
  const existingVote = votes.find(
    (vote) =>
      vote.battleId === submittedVote.battleId &&
      vote.judgeId === submittedVote.judgeId,
  );

  if (existingVote) {
    return votes.map((vote) =>
      vote.id === existingVote.id
        ? {
            ...vote,
            winnerId: submittedVote.winnerId,
          }
        : vote,
    );
  }

  return [...votes, submittedVote];
}

function normalizeQualificationDurationSeconds(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 60;
  }

  return Math.max(1, Math.floor(value));
}

function createRunningQualificationTimer(
  participantId: string,
  durationSeconds: number,
  startsAt: string,
): QualificationTimerState {
  const normalizedDurationSeconds =
    normalizeQualificationDurationSeconds(durationSeconds);

  return {
    status: 'running',
    participantId,
    durationSeconds: normalizedDurationSeconds,
    endsAt: new Date(
      Date.parse(startsAt) + normalizedDurationSeconds * 1000,
    ).toISOString(),
    remainingMsWhenPaused: null,
  };
}
