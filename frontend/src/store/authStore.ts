import { create } from "zustand";
import type { User } from "../lib/types";
import { getToken, getUser, removeToken, setToken, setUser } from "../lib/auth";

interface AuthState {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  login: (user, token) => {
    setToken(token);
    setUser(user);
    set({ user, token });
  },
  logout: () => {
    removeToken();
    set({ user: null, token: null });
  },
  hydrate: () => {
    set({ user: getUser(), token: getToken() });
  },
}));
