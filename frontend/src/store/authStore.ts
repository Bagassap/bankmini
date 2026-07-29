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

// Auth is backed entirely by the httpOnly session cookie the backend sets
// on login (see backend/src/auth/auth.controller.ts) - there is no token to
// persist client-side. hydrate() asks the server whether the current
// cookie/session is still valid, which also doubles as the "was the
// browser closed and the session dropped?" check on every page load.
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "idle",
  login: (user) => set({ user, status: "authenticated" }),
  logout: () => {
    set({ user: null, status: "unauthenticated" });
    api.post("/auth/logout").catch(() => {
      // best-effort: cookie is already cleared client-side either way
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
