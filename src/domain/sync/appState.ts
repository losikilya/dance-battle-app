import { Battle, BattleVote } from '../battle/types';
import { DanceEvent } from '../event/types';
import { Judge } from '../judge/types';
import { Participant } from '../participant/types';
import { QualificationScore } from '../qualification/types';

export type BattleAppState = {
  event: DanceEvent;
  participants: Participant[];
  judges: Judge[];
  scores: QualificationScore[];
  battles: Battle[];
  votes: BattleVote[];

  currentQualificationParticipantIndex: number;
  activeBattleId: string | null;
};
/**
 * - сохранять в SQLite
- отдавать клиентам как snapshot
- восстанавливать из event log


User action
  ↓
Command
  ↓
Validation
  ↓
AppEvent
  ↓
applyEvent()
  ↓
new state
 */