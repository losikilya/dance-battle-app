import { useJudgingClientStore } from '@stores/judgingClient/useJudgingClientStore';
import { useJudgingServerStore } from '@stores/judgingServer/useJudgingServerStore';
import { useSessionStore } from '@stores/session/useSessionStore';

export function resetAppSession(): void {
  useJudgingServerStore.getState().stopServer();
  useJudgingClientStore.getState().resetConnectionTarget();

  const session = useSessionStore.getState();
  session.setRole(null);
  session.setActiveViewRole(null);
  session.setSelfJudgeId(null);
  session.setJudgeId(null);
  session.setJudgeName(null);
}
