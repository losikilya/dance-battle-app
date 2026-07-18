import { calculateBattleWinner } from '../battle/calculateBattleWinner';
import { generateFinalFromSemifinals, generateSemifinalsFromTop8 } from '../battle/advanceWinner';
import { generateTop8Bracket } from '../bracket/generateTop8Bracket';
import { calculateRanking } from '../qualification/calculateRanking';
import { AppEvent } from '../sync/appEvent';
import { createAppEvent } from '../sync/createAppEvent';
import { BattleAppState } from '../sync/appState';
import { createId } from '../../shared/lib/createId';
import { AppCommand } from './command';
import {
  commandFailure,
  CommandHandlerResult,
  commandSuccess,
} from './commandResult';
import { DanceEvent } from '../event/types';
import { Judge, JudgeRole } from '../judge/types';
import { CheckInStatus, Participant } from '../participant/types';
import { QualificationTimerState } from '../qualification/types';

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

    case 'bracket.generateTop8':
      return handleGenerateTop8Command(state);

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

    case 'participant.add':
      return handleAddParticipantCommand(state, command);

    case 'participant.remove':
      return handleRemoveParticipantCommand(state, command);

    case 'participant.toggleCheckIn':
      return handleToggleParticipantCheckInCommand(state, command);

    default:
      return commandFailure('action_not_allowed', 'Unknown command');
  }
}

function handleResetEventCommand(): CommandHandlerResult {
  return commandSuccess([createAppEvent('event.reset', {})]);
}

function handleStartQualificationCommand(
  state: BattleAppState,
  command: Extract<AppCommand, { type: 'qualification.start' }>,
): CommandHandlerResult {
  if (state.event.status !== 'draft') {
    return commandFailure(
      'invalid_status',
      'Qualification can be started only from draft status',
    );
  }

  if (state.participants.length < 8) {
    return commandFailure(
      'not_enough_data',
      'At least 8 participants are required to start qualification',
    );
  }

  if (state.judges.length === 0) {
    return commandFailure(
      'not_enough_data',
      'At least one judge is required to start qualification',
    );
  }

  const firstParticipant = state.participants[0];

  if (!firstParticipant) {
    return commandFailure('not_found', 'First participant was not found');
  }

  return commandSuccess([
    createAppEvent('qualification.started', {
      currentParticipantIndex: 0,
      timer: createRunningQualificationTimer(
        firstParticipant.id,
        state.event.qualificationDurationSeconds,
        command.createdAt,
      ),
    }),
  ]);
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

  const participantExists = state.participants.some(
    (participant) => participant.id === participantId,
  );

  if (!participantExists) {
    return commandFailure('not_found', 'Participant was not found');
  }

  const judgeExists = state.judges.some((judge) => judge.id === judgeId);

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

  const isLastParticipant =
    state.currentQualificationParticipantIndex >= state.participants.length - 1;

  if (isLastParticipant) {
    return commandFailure(
      'action_not_allowed',
      'Current participant is the last participant',
    );
  }

  const currentParticipant =
    state.participants[state.currentQualificationParticipantIndex];

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

  const nextParticipantIndex = state.currentQualificationParticipantIndex + 1;
  const nextParticipant = state.participants[nextParticipantIndex];

  if (!nextParticipant) {
    return commandFailure('not_found', 'Next participant was not found');
  }

  return commandSuccess([
    createAppEvent('qualification.participantAdvanced', {
      participantIndex: nextParticipantIndex,
      reason: command.payload.reason,
      timer: createRunningQualificationTimer(
        nextParticipant.id,
        state.event.qualificationDurationSeconds,
        command.createdAt,
      ),
    }),
  ]);
}

function handleMarkQualificationParticipantAbsentCommand(
  state: BattleAppState,
  command: Extract<AppCommand, { type: 'qualification.markParticipantAbsent' }>,
): CommandHandlerResult {
  if (state.event.status !== 'qualification') {
    return commandFailure(
      'invalid_status',
      'Participant can be marked absent only during qualification',
    );
  }

  const currentParticipant =
    state.participants[state.currentQualificationParticipantIndex];

  if (!currentParticipant) {
    return commandFailure('not_found', 'Current participant was not found');
  }

  if (command.payload.participantId !== currentParticipant.id) {
    return commandFailure(
      'action_not_allowed',
      'Participant is no longer current for qualification',
    );
  }

  if (state.judges.length === 0) {
    return commandFailure('not_enough_data', 'At least one judge is required');
  }

  return commandSuccess([
    createAppEvent('qualification.participantMarkedAbsent', {
      participantId: currentParticipant.id,
      scores: state.judges.map((judge) => ({
        id: createId('score'),
        participantId: currentParticipant.id,
        judgeId: judge.id,
        score: 0,
        createdAt: command.createdAt,
      })),
    }),
  ]);
}

function handleMoveQualificationParticipantToEndCommand(
  state: BattleAppState,
  command: Extract<AppCommand, { type: 'qualification.moveParticipantToEnd' }>,
): CommandHandlerResult {
  if (state.event.status !== 'qualification') {
    return commandFailure(
      'invalid_status',
      'Participant can be moved only during qualification',
    );
  }

  const currentParticipant =
    state.participants[state.currentQualificationParticipantIndex];

  if (!currentParticipant) {
    return commandFailure('not_found', 'Current participant was not found');
  }

  if (command.payload.participantId !== currentParticipant.id) {
    return commandFailure(
      'action_not_allowed',
      'Participant is no longer current for qualification',
    );
  }

  const isLastParticipant =
    state.currentQualificationParticipantIndex >= state.participants.length - 1;

  if (isLastParticipant) {
    return commandFailure(
      'action_not_allowed',
      'Current participant is the last participant',
    );
  }

  const nextParticipant =
    state.participants[state.currentQualificationParticipantIndex + 1];

  if (!nextParticipant) {
    return commandFailure('not_found', 'Next participant was not found');
  }

  return commandSuccess([
    createAppEvent('qualification.participantMovedToEnd', {
      participantId: currentParticipant.id,
      participantIndex: state.currentQualificationParticipantIndex,
      timer: createRunningQualificationTimer(
        nextParticipant.id,
        state.event.qualificationDurationSeconds,
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
    state.participants[state.currentQualificationParticipantIndex];

  if (!currentParticipant) {
    return commandFailure('not_found', 'Current participant was not found');
  }

  return commandSuccess([
    createAppEvent('qualification.timerRestarted', {
      timer: createRunningQualificationTimer(
        currentParticipant.id,
        state.event.qualificationDurationSeconds,
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

  const expectedScoresCount = state.participants.length * state.judges.length;

  if (state.scores.length < expectedScoresCount) {
    return commandFailure(
      'not_enough_data',
      'All participants should receive scores from all judges',
    );
  }

  return commandSuccess([createAppEvent('qualification.finished', {})]);
}

function handleGenerateTop8Command(
  state: BattleAppState,
): CommandHandlerResult {
  if (state.event.status !== 'qualification_finished') {
    return commandFailure(
      'invalid_status',
      'Top 8 can be generated only after qualification is finished',
    );
  }

  if (state.battles.length > 0) {
    return commandFailure(
      'action_not_allowed',
      'Bracket has already been generated',
    );
  }

  const expectedScoresCount = state.participants.length * state.judges.length;

  if (state.scores.length < expectedScoresCount) {
    return commandFailure(
      'not_enough_data',
      'Not enough qualification scores to generate Top 8',
    );
  }

  const ranking = calculateRanking({
    participants: state.participants,
    scores: state.scores,
  });

  const battles = generateTop8Bracket(ranking);

  return commandSuccess([
    createAppEvent('bracket.generated', {
      battles,
    }),
  ]);
}

function handleStartBattleCommand(
  state: BattleAppState,
  command: Extract<AppCommand, { type: 'battle.start' }>,
): CommandHandlerResult {
  if (state.event.status !== 'battle') {
    return commandFailure(
      'invalid_status',
      'Battle can be started only during battle stage',
    );
  }

  const battle = state.battles.find(
    (item) => item.id === command.payload.battleId,
  );

  if (!battle) {
    return commandFailure('not_found', 'Battle was not found');
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
  if (state.event.status !== 'battle') {
    return commandFailure(
      'invalid_status',
      'Voting can be opened only during battle stage',
    );
  }

  const battle = state.battles.find(b => b.id === command.payload.battleId);

  if (!battle) {
    return commandFailure('not_found', 'Battle not found');
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
  if (state.event.status !== 'battle') {
    return commandFailure(
      'invalid_status',
      'Vote can be submitted only during battle stage',
    );
  }

  const { battleId, judgeId, winnerId } = command.payload;

  const battle = state.battles.find((item) => item.id === battleId);

  if (!battle) {
    return commandFailure('not_found', 'Battle was not found');
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

  const judgeExists = state.judges.some((judge) => judge.id === judgeId);

  if (!judgeExists) {
    return commandFailure('not_found', 'Judge was not found');
  }

  const isValidWinner =
    winnerId === battle.participantAId || winnerId === battle.participantBId;

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

  const allJudgesVoted = currentBattleVotes.length === state.judges.length;

  const events: AppEvent[] = [voteSubmittedEvent];

  if (!allJudgesVoted) {
    return commandSuccess(events);
  }

  const calculatedWinnerId = calculateBattleWinner({
    votes: currentBattleVotes,
    judgesCount: state.judges.length,
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

  const top8Battles = state.battles.filter((battle) => battle.round === 'top8');

  const semifinalBattles = state.battles.filter(
    (battle) => battle.round === 'semifinal',
  );

  const hasSemifinals = semifinalBattles.length > 0;
  const hasFinal = state.battles.some((battle) => battle.round === 'final');

  const top8Finished =
    top8Battles.length === 4 &&
    top8Battles.every((battle) => battle.status === 'finished');

  const semifinalsFinished =
    semifinalBattles.length === 2 &&
    semifinalBattles.every((battle) => battle.status === 'finished');

  if (top8Finished && !hasSemifinals) {
    const semifinals = generateSemifinalsFromTop8(top8Battles);

    return commandSuccess([
      createAppEvent('nextRound.generated', {
        battles: semifinals,
      }),
    ]);
  }

  if (semifinalsFinished && !hasFinal) {
    const final = generateFinalFromSemifinals(semifinalBattles);

    return commandSuccess([
      createAppEvent('nextRound.generated', {
        battles: [final],
      }),
    ]);
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
  const {
    title,
    categoryTitle,
    format,
    judgesCount,
    qualificationAdvanceMode,
    qualificationDurationSeconds,
  } = command.payload;
  const newEvent: DanceEvent = {
    id: createId('event'),
    title,
    categoryTitle,
    format,
    judgesCount,
    qualificationDurationSeconds: normalizeQualificationDurationSeconds(
      qualificationDurationSeconds,
    ),
    qualificationAdvanceMode: qualificationAdvanceMode ?? 'manual',
    status: 'draft',
    createdAt: new Date().toISOString(),
  };
  const judges: Judge[] = Array.from({ length: judgesCount }, (_, i) => ({
    id: createId('judge'),
    name: `Judge ${i + 1}`,
    role: (i === 0 ? 'head' : 'standard') as JudgeRole,
  }));
  return commandSuccess([createAppEvent('event.created', { event: newEvent, judges })]);
}

function handleAddParticipantCommand(
  state: BattleAppState,
  command: Extract<AppCommand, { type: 'participant.add' }>,
): CommandHandlerResult {
  const { name, number, crew, city } = command.payload;
  if (state.participants.some(p => p.number === number)) {
    return commandFailure('invalid_number', 'Participant number already exists');
  }
  const participant: Participant = {
    id: createId('participant'),
    number,
    name,
    crew,
    city,
    checkIn: 'absent',
    status: 'registered',
  };
  return commandSuccess([createAppEvent('participant.added', { participant })]);
}

function handleRemoveParticipantCommand(
  state: BattleAppState,
  command: Extract<AppCommand, { type: 'participant.remove' }>,
): CommandHandlerResult {
  const { participantId } = command.payload;
  if (!state.participants.find(p => p.id === participantId)) {
    return commandFailure('not_found', 'Participant not found');
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
