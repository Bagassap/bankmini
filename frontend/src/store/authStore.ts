import { create } from "zustand";
import type { User } from "../lib/types";
import api from "../lib/api";

export type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

interface AuthState {
  user: User | null;
  status: AuthStatus;
  login: (user: User) => void;
  logout: () => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "idle",
  login: (user) => set({ user, status: "authenticated" }),
  logout: () => {
    set({ user: null, status: "unauthenticated" });
    api.post("/auth/logout").catch(() => {
    });
  },
  hydrate: async () => {
    set({ status: "loading" });
    try {
      const { data } = await api.get<User>("/auth/me");
      set({ user: data, status: "authenticated" });
    } catch {
      set({ user: null, status: "unauthenticated" });
    }
  },
}));
