import { create } from 'zustand';
import { AppRole } from '@domain/role/types';

type SessionState = {
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
  setJudgeName: (name: string | null) => void;
};

function uniqueRoles(roles: AppRole[]): AppRole[] {
  return Array.from(new Set(roles));
}

function normalizeRoles(roles: AppRole[]): AppRole[] {
  if (roles.length === 0) {
    return [];
  }

  if (roles.includes('host')) {
    return uniqueRoles(['host', 'spectator', ...roles]);
  }

  return uniqueRoles(['spectator', ...roles.filter(role => role !== 'host')]);
}

export const useSessionStore = create<SessionState & SessionActions>(
  (set, get) => ({
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
          const isHost = state.roles.includes('host');
          const lastHostRoles = isHost ? state.roles : state.lastHostRoles;

          return {
            roles: [],
            lastHostRoles,
            lastHostSelfJudgeId: isHost
              ? state.selfJudgeId
              : state.lastHostSelfJudgeId,
            activeViewRole: null,
            selfJudgeId: null,
            judgeId: null,
            judgeName: null,
          };
        }

        const isCurrentHost = state.roles.includes('host');
        const roles = role === 'host' && isCurrentHost
          ? normalizeRoles(state.roles)
          : normalizeRoles([role]);

        return {
          roles,
          lastHostRoles: role === 'host' ? roles : state.lastHostRoles,
          activeViewRole: role,
          selfJudgeId: role === 'host' ? state.selfJudgeId : null,
        };
      }),

    setRoles: roles =>
      set(state => {
        const normalizedRoles = normalizeRoles(roles);
        const isHost = normalizedRoles.includes('host');

        return {
          roles: normalizedRoles,
          lastHostRoles: isHost ? normalizedRoles : state.lastHostRoles,
          selfJudgeId: normalizedRoles.includes('judge')
            ? state.selfJudgeId
            : null,
        };
      }),

    toggleRole: role =>
      set(state => {
        if (role === 'spectator' || (state.roles.includes('host') && role === 'host')) {
          return state;
        }

        const hasRole = state.roles.includes(role);
        const roles = hasRole
          ? state.roles.filter(item => item !== role)
          : [...state.roles, role];

        return {
          roles: normalizeRoles(roles),
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
          state.roles.includes('host') ? selfJudgeId : state.lastHostSelfJudgeId,
      })),
    setJudgeId: judgeId => set({ judgeId }),
    setJudgeName: judgeName => set({ judgeName }),
  }),
);
