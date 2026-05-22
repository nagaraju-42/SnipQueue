import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Role } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  role: Role | null;
  setTokens: (access: string, refresh: string) => void;
  setUser: (user: User) => void;
  login: (user: User, access: string, refresh: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      role: null,
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      setUser: (user) => set({ user, role: user.role }),
      login: (user, accessToken, refreshToken) => set({ user, accessToken, refreshToken, isAuthenticated: true, role: user.role }),
      logout: () => set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, role: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
