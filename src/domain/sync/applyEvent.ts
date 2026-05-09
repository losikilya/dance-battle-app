import { BattleAppState } from "./appState";
import { AppEvent } from "./appEvent";
import { createInitialBattleState } from "./createInitialBattleState";

export function applyEvent(
  state: BattleAppState,
  event: AppEvent,
): BattleAppState {
  switch (event.type) {
    case "event.reset": {
      return createInitialBattleState();
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

    default: {
      return state;
    }
  }
}
