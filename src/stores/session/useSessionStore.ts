import { create } from 'zustand';
import { AppRole } from '@domain/role/types';

type SessionState = {
  role: AppRole | null;
  roles: AppRole[];
  lastHostRoles: AppRole[];
  lastHostSelfJudgeId: string | null;
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
    lastHostRoles: [],
    lastHostSelfJudgeId: null,
    activeViewRole: null,
    selfJudgeId: null,
    judgeId: null,
    judgeName: null,

    setRole: role =>
      set(state => {
        if (role === null) {
          const lastHostRoles =
            state.role === 'host' && state.roles.includes('host')
              ? state.roles
              : state.lastHostRoles;

          return {
            role: null,
            roles: [],
            lastHostRoles,
            lastHostSelfJudgeId:
              state.role === 'host'
                ? state.selfJudgeId
                : state.lastHostSelfJudgeId,
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
          lastHostRoles: role === 'host' ? roles : state.lastHostRoles,
          activeViewRole: role,
          selfJudgeId: role === 'host' ? state.selfJudgeId : null,
        };
      }),

    setRoles: roles =>
      set(state => {
        const normalizedRoles = normalizeRoles(state.role, roles);

        return {
          roles: normalizedRoles,
          lastHostRoles:
            state.role === 'host' ? normalizedRoles : state.lastHostRoles,
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
    setSelfJudgeId: selfJudgeId =>
      set(state => ({
        selfJudgeId,
        lastHostSelfJudgeId:
          state.role === 'host' ? selfJudgeId : state.lastHostSelfJudgeId,
      })),
    setJudgeId: judgeId => set({ judgeId }),
    setJudgeName: judgeName => set({ judgeName }),
  }),
);
