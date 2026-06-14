import { create } from 'zustand';
import { AppRole } from '@domain/role/types';

type SessionState = {
  role: AppRole | null;
};

type SessionActions = {
  setRole: (role: AppRole) => void;
};

export const useSessionStore = create<SessionState & SessionActions>((set) => ({
  role: null,
  setRole: (role) => set({ role }),
}));
