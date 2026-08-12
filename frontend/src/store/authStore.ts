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

// Cookie sesi sudah tanpa masa berlaku tersimpan (session cookie), tapi
// browser bisa saja mempertahankannya lewat fitur "lanjutkan sesi
// sebelumnya" saat ditutup lalu dibuka lagi. sessionStorage sungguh-sungguh
// kosong lagi setiap kali tab/jendela baru dibuka, jadi dipakai sebagai
// penanda "tab ini pernah login" - kalau cookie masih valid tapi penanda
// ini tidak ada, anggap sebagai sesi lama yang harus login ulang.
const SESSION_MARKER_KEY = "bankmini_session_active";

function markSessionActive() {
  try {
    sessionStorage.setItem(SESSION_MARKER_KEY, "1");
  } catch {
    // sessionStorage tidak tersedia (mis. mode privat ketat) - abaikan.
  }
}

function hasSessionMarker(): boolean {
  try {
    return sessionStorage.getItem(SESSION_MARKER_KEY) === "1";
  } catch {
    return false;
  }
}

function clearSessionMarker() {
  try {
    sessionStorage.removeItem(SESSION_MARKER_KEY);
  } catch {
    // ignore
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "idle",
  login: (user) => {
    markSessionActive();
    set({ user, status: "authenticated" });
  },
  logout: () => {
    clearSessionMarker();
    set({ user: null, status: "unauthenticated" });
    api.post("/auth/logout").catch(() => {
    });
  },
  hydrate: async () => {
    set({ status: "loading" });
    try {
      const { data } = await api.get<User>("/auth/me");
      if (!hasSessionMarker()) {
        set({ user: null, status: "unauthenticated" });
        api.post("/auth/logout").catch(() => {
        });
        return;
      }
      set({ user: data, status: "authenticated" });
    } catch {
      set({ user: null, status: "unauthenticated" });
    }
  },
}));
