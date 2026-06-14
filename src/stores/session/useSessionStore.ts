import { create } from 'zustand';
import { AppRole } from '@domain/role/types';

type SessionState = {
  role: AppRole | null;
  judgeId: string | null;
  judgeName: string | null;
};

type SessionActions = {
  setRole: (role: AppRole | null) => void;
  setJudgeId: (id: string) => void;
  setJudgeName: (name: string) => void;
};

export const useSessionStore = create<SessionState & SessionActions>((set) => ({
  role: null,
  judgeId: 'judge_dev',
  judgeName: null,
  setRole: (role) => set({ role }),
  setJudgeId: (judgeId) => set({ judgeId }),
  setJudgeName: (judgeName) => set({ judgeName }),
}));
