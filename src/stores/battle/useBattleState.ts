import { useSessionStore } from "@stores/session/useSessionStore";
import { useDemoBattleStore } from "@stores/demoBattle/useDemoBattleStore";
import { useJudgingClientStore } from "@stores/judgingClient/useJudgingClientStore";
import type { BattleAppState } from "@domain/sync/appState";
import { getActiveBattleConfigurationId, isInBattleConfiguration } from "@domain/sync/stateSelectors";

export type BattleStateResult = {
  state: BattleAppState | null;
  isHost: boolean;
  source: 'host' | 'remote';
};

export function useBattleState(): BattleStateResult {
  const hasHostRole = useSessionStore((s) => s.roles.includes('host'));
  const assignedClientRole = useJudgingClientStore((s) => s.role);

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
  const clientStatus = useJudgingClientStore((s) => s.status);
  const syncedState = useJudgingClientStore((s) => s.syncedState);
  const isRemoteClient = assignedClientRole !== null || clientStatus === 'connected';
  const isHost = hasHostRole && !isRemoteClient;

  const activeBattleConfigurationId = getActiveBattleConfigurationId(event);
  const activeParticipants = participants.filter(
    (p) => isInBattleConfiguration(activeBattleConfigurationId, p),
  );
  const activeParticipantIds = new Set(activeParticipants.map((p) => p.id));
  const activeScores = scores.filter((score) =>
    activeParticipantIds.has(score.participantId),
  );
  const activeBattles = battles.filter(
    (b) => isInBattleConfiguration(activeBattleConfigurationId, b),
  );
  const activeBattleIds = new Set(activeBattles.map((battle) => battle.id));
  const activeVotes = votes.filter((vote) => activeBattleIds.has(vote.battleId));

  const hostState: BattleAppState = {
    event,
    participants: activeParticipants,
    judges,
    scores: activeScores,
    battles: activeBattles,
    votes: activeVotes,
    currentQualificationParticipantIndex,
    qualificationTimer,
    activeBattleId,
    systemLogs,
  };

  if (!syncedState) {
    return {
      state: isHost ? hostState : null,
      isHost,
      source: isHost ? 'host' : 'remote',
    };
  }

  const syncedActiveBattleConfigurationId = getActiveBattleConfigurationId(syncedState.event);
  const syncedBattles = syncedState.battles.filter(
    (b) => isInBattleConfiguration(syncedActiveBattleConfigurationId, b),
  );
  const syncedBattleIds = new Set(syncedBattles.map((b) => b.id));
  const syncedParticipants = syncedState.participants.filter(
    (p) => isInBattleConfiguration(syncedActiveBattleConfigurationId, p),
  );
  const syncedParticipantIds = new Set(
    syncedParticipants.map((participant) => participant.id),
  );
  const filteredSyncedState: BattleAppState = {
    ...syncedState,
    participants: syncedParticipants,
    scores: syncedState.scores.filter((score) =>
      syncedParticipantIds.has(score.participantId),
    ),
    battles: syncedBattles,
    votes: syncedState.votes.filter((vote) => syncedBattleIds.has(vote.battleId)),
  };

  return {
    state: isHost ? hostState : filteredSyncedState,
    isHost,
    source: isHost ? 'host' : 'remote',
  };
}
