import { useSessionStore } from "@stores/session/useSessionStore";
import { useDemoBattleStore } from "@stores/demoBattle/useDemoBattleStore";
import { useJudgingClientStore } from "@stores/judgingClient/useJudgingClientStore";
import type { BattleAppState } from "@domain/sync/appState";

export type BattleStateResult = {
  state: BattleAppState | null;
  isHost: boolean;
};

export function useBattleState(): BattleStateResult {
  const role = useSessionStore((s) => s.role);
  const roles = useSessionStore((s) => s.roles);
  const isHost = role === "host" || roles.includes("host");

  const event = useDemoBattleStore((s) => s.event);
  const participants = useDemoBattleStore((s) => s.participants);
  const judges = useDemoBattleStore((s) => s.judges);
  const scores = useDemoBattleStore((s) => s.scores);
  const battles = useDemoBattleStore((s) => s.battles);
  const votes = useDemoBattleStore((s) => s.votes);
  const currentQualificationParticipantIndex = useDemoBattleStore(
    (s) => s.currentQualificationParticipantIndex,
  );
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
    activeBattleId,
    systemLogs,
  };

  return { state: isHost ? hostState : syncedState, isHost };
}
