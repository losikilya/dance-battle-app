import {
  createDemoEvent,
  createDemoJudges,
  createDemoParticipants,
} from '../demo/createDemoEvent';
import { BattleAppState } from './appState';

export function createInitialBattleState(): BattleAppState {
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