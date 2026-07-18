import { useSessionStore } from "@stores/session/useSessionStore";
import { useDemoBattleStore } from "@stores/demoBattle/useDemoBattleStore";
import { useJudgingClientStore } from "@stores/judgingClient/useJudgingClientStore";
import type { BattleAppState } from "@domain/sync/appState";
import type { Battle } from "@domain/battle/types";
import type { DanceEvent } from "@domain/event/types";
import type { Judge } from "@domain/judge/types";
import type { Participant } from "@domain/participant/types";
import type {
  QualificationScore,
  QualificationTimerState,
} from "@domain/qualification/types";

export type BattleStateResult = {
  state: BattleAppState | null;
  isHost: boolean;
  isRemote: boolean;
  source: 'host' | 'remote';
  isReady: boolean;
  missingState: boolean;
  event: DanceEvent | null;
  participants: Participant[];
  judges: Judge[];
  scores: QualificationScore[];
  battles: Battle[];
  votes: BattleAppState['votes'];
  currentQualificationParticipantIndex: number;
  activeBattleId: string | null;
  qualificationTimer: QualificationTimerState | null;
};

export function useVisibleBattleState(): BattleStateResult {
  const isHost = useSessionStore((s) => s.hasRole('host'));

  const event = useDemoBattleStore((s) => s.event);
  const participants = useDemoBattleStore((s) => s.participants);
  const judges = useDemoBattleStore((s) => s.judges);
  const scores = useDemoBattleStore((s) => s.scores);
  const battles = useDemoBattleStore((s) => s.battles);
  const votes = useDemoBattleStore((s) => s.votes);
  const currentQualificationParticipantIndex = useDemoBattleStore(
    (s) => s.currentQualificationParticipantIndex,
  );
  const qualificationTimer = useDemoBattleStore((s) => s.qualificationTimer);
  const activeBattleId = useDemoBattleStore((s) => s.activeBattleId);
  const systemLogs = useDemoBattleStore((s) => s.systemLogs);
  const syncedState = useJudgingClientStore((s) => s.syncedState);

  const hostState: BattleAppState = {
    event,
    participants,
    judges,
    scores,
    battles,
    votes,
    currentQualificationParticipantIndex,
    qualificationTimer,
    activeBattleId,
    systemLogs,
  };

  const visibleState = isHost ? hostState : syncedState;
  const isRemote = !isHost;

  return {
    state: visibleState,
    isHost,
    isRemote,
    source: isHost ? 'host' : 'remote',
    isReady: visibleState !== null,
    missingState: visibleState === null,
    event: visibleState?.event ?? null,
    participants: visibleState?.participants ?? [],
    judges: visibleState?.judges ?? [],
    scores: visibleState?.scores ?? [],
    battles: visibleState?.battles ?? [],
    votes: visibleState?.votes ?? [],
    currentQualificationParticipantIndex:
      visibleState?.currentQualificationParticipantIndex ?? 0,
    activeBattleId: visibleState?.activeBattleId ?? null,
    qualificationTimer: visibleState?.qualificationTimer ?? null,
  };
}

export function useBattleState(): BattleStateResult {
  return useVisibleBattleState();
}
