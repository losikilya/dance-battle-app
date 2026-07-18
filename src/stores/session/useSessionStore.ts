import { create } from 'zustand';
import { AppRole } from '@domain/role/types';

type SessionState = {
  roles: AppRole[];
  activeViewRole: AppRole | null;
  selfJudgeId: string | null;
  judgeId: string | null;
  judgeName: string | null;
};

type SessionActions = {
  setRoles: (roles: AppRole[]) => void;
  toggleRole: (role: AppRole) => void;
  hasRole: (role: AppRole) => boolean;
  isHost: () => boolean;
  isJudge: () => boolean;
  isMC: () => boolean;
  isSpectator: () => boolean;
  setActiveViewRole: (role: AppRole | null) => void;
  setSelfJudgeId: (judgeId: string | null) => void;
  setJudgeId: (id: string | null) => void;
  setJudgeName: (name: string) => void;
  clearSession: () => void;
  resetSession: () => void;
};

function uniqueRoles(roles: AppRole[]): AppRole[] {
  return Array.from(new Set(roles));
}

function normalizeRoles(roles: AppRole[]): AppRole[] {
  if (roles.includes('host')) {
    return uniqueRoles(['host', 'spectator', ...roles]);
  }

  return uniqueRoles(roles);
}

function normalizeActiveViewRole(
  activeViewRole: AppRole | null,
  roles: AppRole[],
): AppRole | null {
  if (roles.includes('host')) {
    return activeViewRole ?? 'host';
  }

  if (activeViewRole !== null && roles.includes(activeViewRole)) {
    return activeViewRole;
  }

  return roles[0] ?? null;
}

export const useSessionStore = create<SessionState & SessionActions>(
  (set, get) => ({
    roles: [],
    activeViewRole: null,
    selfJudgeId: null,
    judgeId: null,
    judgeName: null,

    setRoles: roles =>
      set(state => {
        const normalizedRoles = normalizeRoles(roles);

        return {
          roles: normalizedRoles,
          activeViewRole: normalizeActiveViewRole(
            state.activeViewRole,
            normalizedRoles,
          ),
          selfJudgeId: normalizedRoles.includes('judge')
            ? state.selfJudgeId
            : null,
        };
      }),

    toggleRole: role =>
      set(state => {
        const isHostSession = state.roles.includes('host');
        if (isHostSession && (role === 'host' || role === 'spectator')) {
          return state;
        }

        const hasRole = state.roles.includes(role);
        const nextRoles = hasRole
          ? state.roles.filter(item => item !== role)
          : [...state.roles, role];
        const normalizedRoles = normalizeRoles(nextRoles);

        return {
          roles: normalizedRoles,
          activeViewRole: normalizeActiveViewRole(
            state.activeViewRole,
            normalizedRoles,
          ),
          selfJudgeId:
            role === 'judge' && hasRole ? null : state.selfJudgeId,
        };
      }),

    hasRole: role => get().roles.includes(role),
    isHost: () => get().roles.includes('host'),
    isJudge: () => get().roles.includes('judge'),
    isMC: () => get().roles.includes('mc'),
    isSpectator: () => get().roles.includes('spectator'),

    setActiveViewRole: activeViewRole =>
      set(state => ({
        activeViewRole:
          state.roles.includes('host') ||
          (activeViewRole !== null && state.roles.includes(activeViewRole))
            ? activeViewRole
            : null,
      })),
    setSelfJudgeId: selfJudgeId => set({ selfJudgeId }),
    setJudgeId: judgeId => set({ judgeId }),
    setJudgeName: judgeName => set({ judgeName }),
    clearSession: () =>
      set({
        roles: [],
        activeViewRole: null,
        selfJudgeId: null,
        judgeId: null,
        judgeName: null,
      }),
    resetSession: () => get().clearSession(),
  }),
);
