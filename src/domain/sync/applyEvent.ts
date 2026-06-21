import { BattleAppState } from "./appState";
import { AppEvent } from "./appEvent";
import { createInitialBattleState } from "./createInitialBattleState";

function logEntry(message: string): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `[${hh}:${mm}:${ss}] ${message}`;
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
        event: event.payload.event,
        judges: event.payload.judges,
        systemLogs: [logEntry(`Event "${event.payload.event.title}" initialized.`)],
      };
    }

    case "qualification.started": {
      return {
        ...state,
        event: {
          ...state.event,
          status: "qualification",
        },
        scores: [],
        battles: [],
        votes: [],
        activeBattleId: null,
        currentQualificationParticipantIndex:
          event.payload.currentParticipantIndex,
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
        event: {
          ...state.event,
          status: "qualification_finished",
        },
        systemLogs: [...state.systemLogs, logEntry('Qualification finished.')],
      };
    }

    case "bracket.generated": {
      return {
        ...state,
        event: {
          ...state.event,
          status: "battle",
        },
        battles: event.payload.battles,
        votes: [],
        activeBattleId: null,
        systemLogs: [...state.systemLogs, logEntry('Top 8 bracket generated.')],
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
      };
    }

    case "participant.added": {
      return {
        ...state,
        participants: [...state.participants, event.payload.participant],
        systemLogs: [...state.systemLogs, logEntry(`Participant "${event.payload.participant.name}" added.`)],
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
