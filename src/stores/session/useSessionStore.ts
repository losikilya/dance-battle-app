import { create } from 'zustand';
import { AppRole } from '@domain/role/types';

type SessionState = {
  role: AppRole | null;
  roles: AppRole[];
  activeViewRole: AppRole | null;
  selfJudgeId: string | null;
  judgeId: string | null;
  judgeName: string | null;
};

type SessionActions = {
  setRole: (role: AppRole | null) => void;
  setRoles: (roles: AppRole[]) => void;
  toggleRole: (role: AppRole) => void;
  hasRole: (role: AppRole) => boolean;
  setActiveViewRole: (role: AppRole | null) => void;
  setSelfJudgeId: (judgeId: string | null) => void;
  setJudgeId: (id: string | null) => void;
  setJudgeName: (name: string) => void;
};

function uniqueRoles(roles: AppRole[]): AppRole[] {
  return Array.from(new Set(roles));
}

function normalizeRoles(
  primaryRole: AppRole | null,
  roles: AppRole[],
): AppRole[] {
  if (primaryRole === null) {
    return [];
  }

  if (primaryRole === 'host') {
    return uniqueRoles(['host', 'spectator', ...roles]);
  }

  return uniqueRoles([primaryRole, ...roles.filter(role => role !== 'host')]);
}

export const useSessionStore = create<SessionState & SessionActions>(
  (set, get) => ({
    role: null,
    roles: [],
    activeViewRole: null,
    selfJudgeId: null,
    judgeId: null,
    judgeName: null,

    setRole: role =>
      set(state => {
        if (role === null) {
          return {
            role: null,
            roles: [],
            activeViewRole: null,
            selfJudgeId: null,
          };
        }

        const roles =
          role === 'host' && state.role === 'host'
            ? normalizeRoles(role, state.roles)
            : normalizeRoles(role, []);

        return {
          role,
          roles,
          activeViewRole: role,
          selfJudgeId: role === 'host' ? state.selfJudgeId : null,
        };
      }),

    setRoles: roles =>
      set(state => {
        const normalizedRoles = normalizeRoles(state.role, roles);

        return {
          roles: normalizedRoles,
          selfJudgeId: normalizedRoles.includes('judge')
            ? state.selfJudgeId
            : null,
        };
      }),

    toggleRole: role =>
      set(state => {
        if (
          state.role === 'host' &&
          (role === 'host' || role === 'spectator')
        ) {
          return state;
        }

        const hasRole = state.roles.includes(role);
        const roles = hasRole
          ? state.roles.filter(item => item !== role)
          : [...state.roles, role];

        return {
          roles: normalizeRoles(state.role, roles),
          selfJudgeId:
            role === 'judge' && hasRole ? null : state.selfJudgeId,
        };
      }),

    hasRole: role => get().roles.includes(role),

    setActiveViewRole: activeViewRole => set({ activeViewRole }),
    setSelfJudgeId: selfJudgeId => set({ selfJudgeId }),
    setJudgeId: judgeId => set({ judgeId }),
    setJudgeName: judgeName => set({ judgeName }),
  }),
);
