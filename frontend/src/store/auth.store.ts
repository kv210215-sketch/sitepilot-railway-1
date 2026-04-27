import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  status: string;
  emailVerified: boolean;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface AuthState {
  user:   AuthUser | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;

  setAuth:   (user: AuthUser, tokens: AuthTokens) => void;
  setTokens: (tokens: AuthTokens) => void;
  logout:    () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user:            null,
      tokens:          null,
      isAuthenticated: false,

      setAuth: (user, tokens) =>
        set({ user, tokens, isAuthenticated: true }),

      setTokens: (tokens) =>
        set((s) => ({ ...s, tokens })),

      logout: () =>
        set({ user: null, tokens: null, isAuthenticated: false }),
    }),
    {
      name:    'sitepilot-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        user:            s.user,
        tokens:          s.tokens,
        isAuthenticated: s.isAuthenticated,
      }),
    },
  ),
);
