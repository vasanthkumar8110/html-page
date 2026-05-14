import { create } from 'zustand';
import { storage } from '../api/client';

interface User {
  id: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: !!storage.getString('accessToken'),
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => {
    storage.delete('accessToken');
    storage.delete('refreshToken');
    set({ user: null, isAuthenticated: false });
  },
}));
